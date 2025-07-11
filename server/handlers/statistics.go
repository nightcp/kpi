package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"dootask-kpi-server/models"

	"github.com/gin-gonic/gin"
)

// 统计分析

// 获取仪表板统计数据
func GetDashboardStats(c *gin.Context) {
	var stats struct {
		TotalEmployees       int64                  `json:"total_employees"`
		TotalDepartments     int64                  `json:"total_departments"`
		TotalEvaluations     int64                  `json:"total_evaluations"`
		PendingEvaluations   int64                  `json:"pending_evaluations"`
		CompletedEvaluations int64                  `json:"completed_evaluations"`
		AverageScore         float64                `json:"average_score"`
		RecentEvaluations    []models.KPIEvaluation `json:"recent_evaluations"`
	}

	// 获取基本统计数据
	models.DB.Model(&models.Employee{}).Count(&stats.TotalEmployees)
	models.DB.Model(&models.Department{}).Count(&stats.TotalDepartments)
	models.DB.Model(&models.KPIEvaluation{}).Count(&stats.TotalEvaluations)
	models.DB.Model(&models.KPIEvaluation{}).Where("status = ?", "pending").Count(&stats.PendingEvaluations)
	models.DB.Model(&models.KPIEvaluation{}).Where("status = ?", "completed").Count(&stats.CompletedEvaluations)

	// 计算平均得分
	var avgResult struct {
		AvgScore float64
	}
	models.DB.Model(&models.KPIEvaluation{}).Select("AVG(total_score) as avg_score").Where("status = ?", "completed").Scan(&avgResult)
	stats.AverageScore = avgResult.AvgScore

	// 获取最近的评估记录
	models.DB.Preload("Employee.Department").Preload("Template").Order("created_at DESC").Limit(10).Find(&stats.RecentEvaluations)

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// 获取部门统计数据
func GetDepartmentStats(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	var stats struct {
		DepartmentInfo  models.Department `json:"department_info"`
		EmployeeCount   int64             `json:"employee_count"`
		EvaluationCount int64             `json:"evaluation_count"`
		AverageScore    float64           `json:"average_score"`
		MonthlyStats    []struct {
			Month           string  `json:"month"`
			EvaluationCount int64   `json:"evaluation_count"`
			AverageScore    float64 `json:"average_score"`
		} `json:"monthly_stats"`
		TopPerformers []struct {
			Employee     models.Employee `json:"employee"`
			AverageScore float64         `json:"average_score"`
		} `json:"top_performers"`
	}

	// 获取部门信息
	if err := models.DB.Preload("Employees").First(&stats.DepartmentInfo, departmentId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "部门不存在",
		})
		return
	}

	// 获取员工数量
	models.DB.Model(&models.Employee{}).Where("department_id = ?", departmentId).Count(&stats.EmployeeCount)

	// 获取评估数量和平均分
	models.DB.Model(&models.KPIEvaluation{}).
		Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
		Where("employees.department_id = ?", departmentId).
		Count(&stats.EvaluationCount)

	var avgResult struct {
		AvgScore float64
	}
	models.DB.Model(&models.KPIEvaluation{}).
		Select("AVG(total_score) as avg_score").
		Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
		Where("employees.department_id = ? AND kpi_evaluations.status = ?", departmentId, "completed").
		Scan(&avgResult)
	stats.AverageScore = avgResult.AvgScore

	// 获取月度统计（最近6个月）
	for i := 5; i >= 0; i-- {
		date := time.Now().AddDate(0, -i, 0)
		month := date.Format("2006-01")

		var monthStats struct {
			EvaluationCount int64
			AverageScore    float64
		}

		models.DB.Model(&models.KPIEvaluation{}).
			Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
			Where("employees.department_id = ? AND kpi_evaluations.period LIKE ?", departmentId, month+"%").
			Count(&monthStats.EvaluationCount)

		var monthAvg struct {
			AvgScore float64
		}
		models.DB.Model(&models.KPIEvaluation{}).
			Select("AVG(total_score) as avg_score").
			Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
			Where("employees.department_id = ? AND kpi_evaluations.period LIKE ? AND kpi_evaluations.status = ?", departmentId, month+"%", "completed").
			Scan(&monthAvg)

		stats.MonthlyStats = append(stats.MonthlyStats, struct {
			Month           string  `json:"month"`
			EvaluationCount int64   `json:"evaluation_count"`
			AverageScore    float64 `json:"average_score"`
		}{
			Month:           month,
			EvaluationCount: monthStats.EvaluationCount,
			AverageScore:    monthAvg.AvgScore,
		})
	}

	// 获取部门top performers
	var topPerformers []struct {
		EmployeeID   uint
		AverageScore float64
	}

	models.DB.Model(&models.KPIEvaluation{}).
		Select("employee_id, AVG(total_score) as average_score").
		Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
		Where("employees.department_id = ? AND kpi_evaluations.status = ?", departmentId, "completed").
		Group("employee_id").
		Order("average_score DESC").
		Limit(5).
		Scan(&topPerformers)

	for _, performer := range topPerformers {
		var employee models.Employee
		models.DB.First(&employee, performer.EmployeeID)
		stats.TopPerformers = append(stats.TopPerformers, struct {
			Employee     models.Employee `json:"employee"`
			AverageScore float64         `json:"average_score"`
		}{
			Employee:     employee,
			AverageScore: performer.AverageScore,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// 获取员工统计数据
func GetEmployeeStats(c *gin.Context) {
	id := c.Param("id")
	employeeId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var stats struct {
		EmployeeInfo    models.Employee `json:"employee_info"`
		EvaluationCount int64           `json:"evaluation_count"`
		AverageScore    float64         `json:"average_score"`
		LatestScore     float64         `json:"latest_score"`
		ScoreTrend      []struct {
			Period string  `json:"period"`
			Score  float64 `json:"score"`
		} `json:"score_trend"`
		KPIBreakdown []struct {
			ItemName     string  `json:"item_name"`
			AverageScore float64 `json:"average_score"`
			MaxScore     float64 `json:"max_score"`
		} `json:"kpi_breakdown"`
	}

	// 获取员工信息
	if err := models.DB.Preload("Department").Preload("Manager").First(&stats.EmployeeInfo, employeeId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "员工不存在",
		})
		return
	}

	// 获取评估数量和平均分
	models.DB.Model(&models.KPIEvaluation{}).Where("employee_id = ?", employeeId).Count(&stats.EvaluationCount)

	var avgResult struct {
		AvgScore float64
	}
	models.DB.Model(&models.KPIEvaluation{}).
		Select("AVG(total_score) as avg_score").
		Where("employee_id = ? AND status = ?", employeeId, "completed").
		Scan(&avgResult)
	stats.AverageScore = avgResult.AvgScore

	// 获取最新评估分数
	var latestEval models.KPIEvaluation
	if err := models.DB.Where("employee_id = ? AND status = ?", employeeId, "completed").
		Order("created_at DESC").First(&latestEval).Error; err == nil {
		stats.LatestScore = latestEval.TotalScore
	}

	// 获取分数趋势（最近6次评估）
	var evaluations []models.KPIEvaluation
	models.DB.Where("employee_id = ? AND status = ?", employeeId, "completed").
		Order("created_at DESC").Limit(6).Find(&evaluations)

	for i := len(evaluations) - 1; i >= 0; i-- {
		stats.ScoreTrend = append(stats.ScoreTrend, struct {
			Period string  `json:"period"`
			Score  float64 `json:"score"`
		}{
			Period: evaluations[i].Period,
			Score:  evaluations[i].TotalScore,
		})
	}

	// 获取KPI项目分析
	var kpiBreakdown []struct {
		ItemName     string
		AverageScore float64
		MaxScore     float64
	}

	models.DB.Model(&models.KPIScore{}).
		Select("kpi_items.name as item_name, AVG(kpi_scores.final_score) as average_score, kpi_items.max_score").
		Joins("JOIN kpi_items ON kpi_scores.item_id = kpi_items.id").
		Joins("JOIN kpi_evaluations ON kpi_scores.evaluation_id = kpi_evaluations.id").
		Where("kpi_evaluations.employee_id = ? AND kpi_scores.final_score IS NOT NULL", employeeId).
		Group("kpi_items.id, kpi_items.name, kpi_items.max_score").
		Scan(&kpiBreakdown)

	for _, item := range kpiBreakdown {
		stats.KPIBreakdown = append(stats.KPIBreakdown, struct {
			ItemName     string  `json:"item_name"`
			AverageScore float64 `json:"average_score"`
			MaxScore     float64 `json:"max_score"`
		}{
			ItemName:     item.ItemName,
			AverageScore: item.AverageScore,
			MaxScore:     item.MaxScore,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// 获取趋势分析
func GetTrends(c *gin.Context) {
	period := c.DefaultQuery("period", "monthly") // monthly, quarterly, yearly

	var trends struct {
		PeriodType  string `json:"period_type"`
		ScoreTrends []struct {
			Period          string  `json:"period"`
			AverageScore    float64 `json:"average_score"`
			EvaluationCount int64   `json:"evaluation_count"`
		} `json:"score_trends"`
		DepartmentTrends []struct {
			DepartmentName  string  `json:"department_name"`
			AverageScore    float64 `json:"average_score"`
			EvaluationCount int64   `json:"evaluation_count"`
		} `json:"department_trends"`
	}

	trends.PeriodType = period

	// 获取时间段列表
	var periods []string
	switch period {
	case "monthly":
		for i := 11; i >= 0; i-- {
			date := time.Now().AddDate(0, -i, 0)
			periods = append(periods, date.Format("2006-01"))
		}
	case "quarterly":
		for i := 7; i >= 0; i-- {
			date := time.Now().AddDate(0, -i*3, 0)
			quarter := (date.Month()-1)/3 + 1
			periods = append(periods, fmt.Sprintf("%d-Q%d", date.Year(), quarter))
		}
	case "yearly":
		for i := 4; i >= 0; i-- {
			date := time.Now().AddDate(-i, 0, 0)
			periods = append(periods, fmt.Sprintf("%d", date.Year()))
		}
	}

	// 获取每个时间段的统计数据
	for _, p := range periods {
		var periodStats struct {
			AverageScore    float64
			EvaluationCount int64
		}

		var pattern string
		switch period {
		case "monthly":
			pattern = p + "%"
		case "quarterly":
			pattern = p + "%"
		case "yearly":
			pattern = p + "%"
		}

		models.DB.Model(&models.KPIEvaluation{}).
			Where("period LIKE ? AND status = ?", pattern, "completed").
			Count(&periodStats.EvaluationCount)

		var avgResult struct {
			AvgScore float64
		}
		models.DB.Model(&models.KPIEvaluation{}).
			Select("AVG(total_score) as avg_score").
			Where("period LIKE ? AND status = ?", pattern, "completed").
			Scan(&avgResult)

		trends.ScoreTrends = append(trends.ScoreTrends, struct {
			Period          string  `json:"period"`
			AverageScore    float64 `json:"average_score"`
			EvaluationCount int64   `json:"evaluation_count"`
		}{
			Period:          p,
			AverageScore:    avgResult.AvgScore,
			EvaluationCount: periodStats.EvaluationCount,
		})
	}

	// 获取部门趋势
	var deptTrends []struct {
		DepartmentName  string
		AverageScore    float64
		EvaluationCount int64
	}

	models.DB.Model(&models.KPIEvaluation{}).
		Select("departments.name as department_name, AVG(kpi_evaluations.total_score) as average_score, COUNT(*) as evaluation_count").
		Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
		Joins("JOIN departments ON employees.department_id = departments.id").
		Where("kpi_evaluations.status = ?", "completed").
		Group("departments.id, departments.name").
		Order("average_score DESC").
		Scan(&deptTrends)

	for _, dept := range deptTrends {
		trends.DepartmentTrends = append(trends.DepartmentTrends, struct {
			DepartmentName  string  `json:"department_name"`
			AverageScore    float64 `json:"average_score"`
			EvaluationCount int64   `json:"evaluation_count"`
		}{
			DepartmentName:  dept.DepartmentName,
			AverageScore:    dept.AverageScore,
			EvaluationCount: dept.EvaluationCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": trends,
	})
}

// 导出功能（简化版，实际应用中需要使用Excel库）

// 导出单个评估
func ExportEvaluation(c *gin.Context) {
	id := c.Param("id")
	evaluationId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评估ID",
		})
		return
	}

	var evaluation models.KPIEvaluation
	result := models.DB.Preload("Employee.Department").Preload("Template").Preload("Scores.Item").First(&evaluation, evaluationId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "评估不存在",
		})
		return
	}

	// 这里应该生成Excel文件，暂时返回JSON数据
	c.JSON(http.StatusOK, gin.H{
		"message":     "导出成功",
		"data":        evaluation,
		"export_type": "evaluation",
	})
}

// 导出部门评估
func ExportDepartmentEvaluations(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	var evaluations []models.KPIEvaluation
	result := models.DB.Preload("Employee.Department").Preload("Template").
		Joins("JOIN employees ON kpi_evaluations.employee_id = employees.id").
		Where("employees.department_id = ?", departmentId).
		Find(&evaluations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取部门评估数据失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "导出成功",
		"data":        evaluations,
		"export_type": "department",
	})
}

// 导出周期评估
func ExportPeriodEvaluations(c *gin.Context) {
	period := c.Param("period")

	var evaluations []models.KPIEvaluation
	result := models.DB.Preload("Employee.Department").Preload("Template").
		Where("period LIKE ?", period+"%").
		Find(&evaluations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取周期评估数据失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "导出成功",
		"data":        evaluations,
		"export_type": "period",
		"period":      period,
	})
}
