package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"dootask-kpi-server/models"
	"dootask-kpi-server/utils"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

// 导出响应结构
type ExportResponse struct {
	FileURL  string `json:"file_url"`
	FileName string `json:"file_name"`
	FileSize int64  `json:"file_size"`
	Message  string `json:"message"`
}

// 导出评估报告为Excel
func ExportEvaluationToExcel(c *gin.Context) {
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

	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "评估报告"
	f.SetSheetName("Sheet1", sheetName)

	// 设置标题
	f.SetCellValue(sheetName, "A1", "绩效考核评估报告")
	f.MergeCell(sheetName, "A1", "G1")

	// 设置标题样式
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 16,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	f.SetCellStyle(sheetName, "A1", "G1", titleStyle)

	// 设置基本信息
	row := 3
	f.SetCellValue(sheetName, "A"+strconv.Itoa(row), "员工姓名:")
	f.SetCellValue(sheetName, "B"+strconv.Itoa(row), evaluation.Employee.Name)
	f.SetCellValue(sheetName, "D"+strconv.Itoa(row), "部门:")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(row), evaluation.Employee.Department.Name)

	row++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(row), "考核模板:")
	f.SetCellValue(sheetName, "B"+strconv.Itoa(row), evaluation.Template.Name)
	f.SetCellValue(sheetName, "D"+strconv.Itoa(row), "考核周期:")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(row), evaluation.Period)

	row++
	f.SetCellValue(sheetName, "A"+strconv.Itoa(row), "总分:")
	f.SetCellValue(sheetName, "B"+strconv.Itoa(row), evaluation.TotalScore)
	f.SetCellValue(sheetName, "D"+strconv.Itoa(row), "状态:")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(row), getStatusText(evaluation.Status))

	// 设置表头
	row += 2
	headers := []string{"考核项目", "满分", "自评分", "自评说明", "主管评分", "主管说明", "最终得分"}
	for i, header := range headers {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"#E6E6FA"},
			Pattern: 1,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})
	for i := 0; i < len(headers); i++ {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// 设置数据
	for _, score := range evaluation.Scores {
		row++
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), score.Item.Name)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), score.Item.MaxScore)

		if score.SelfScore != nil {
			f.SetCellValue(sheetName, "C"+strconv.Itoa(row), *score.SelfScore)
		}
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), score.SelfComment)

		if score.ManagerScore != nil {
			f.SetCellValue(sheetName, "E"+strconv.Itoa(row), *score.ManagerScore)
		}
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), score.ManagerComment)

		if score.FinalScore != nil {
			f.SetCellValue(sheetName, "G"+strconv.Itoa(row), *score.FinalScore)
		}

		// 设置数据行样式
		dataStyle, _ := f.NewStyle(&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
			},
		})
		for i := 0; i < len(headers); i++ {
			cell := string(rune('A'+i)) + strconv.Itoa(row)
			f.SetCellStyle(sheetName, cell, cell, dataStyle)
		}
	}

	// 添加总结
	if evaluation.FinalComment != "" {
		row += 2
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), "总结评价:")
		f.MergeCell(sheetName, "A"+strconv.Itoa(row), "G"+strconv.Itoa(row))
		row++
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), evaluation.FinalComment)
		f.MergeCell(sheetName, "A"+strconv.Itoa(row), "G"+strconv.Itoa(row+2))
	}

	// 设置列宽
	f.SetColWidth(sheetName, "A", "A", 20)
	f.SetColWidth(sheetName, "B", "B", 10)
	f.SetColWidth(sheetName, "C", "C", 10)
	f.SetColWidth(sheetName, "D", "D", 25)
	f.SetColWidth(sheetName, "E", "E", 10)
	f.SetColWidth(sheetName, "F", "F", 25)
	f.SetColWidth(sheetName, "G", "G", 10)

	// 创建公共导出目录
	exportDir := "./public/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建导出目录失败",
		})
		return
	}

	// 生成文件名
	fileName := fmt.Sprintf("评估报告-%s-%s-%d.xlsx",
		evaluation.Employee.Name,
		evaluation.Period,
		time.Now().Unix())
	filePath := filepath.Join(exportDir, fileName)

	// 保存文件
	if err := f.SaveAs(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 获取文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取文件信息失败",
		})
		return
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/download/exports/%s", fileName))

	c.JSON(http.StatusOK, ExportResponse{
		FileURL:  downloadURL,
		FileName: fileName,
		FileSize: fileInfo.Size(),
		Message:  "导出成功",
	})

	// 30分钟后删除文件
	go func() {
		time.Sleep(time.Minute * 30)
		os.Remove(filePath)
	}()
}

// 导出部门评估汇总
func ExportDepartmentToExcel(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	var department models.Department
	if err := models.DB.First(&department, departmentId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "部门不存在",
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

	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "部门评估汇总"
	f.SetSheetName("Sheet1", sheetName)

	// 设置标题
	f.SetCellValue(sheetName, "A1", fmt.Sprintf("%s 评估汇总报告", department.Name))
	f.MergeCell(sheetName, "A1", "H1")

	// 设置标题样式
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 16,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	f.SetCellStyle(sheetName, "A1", "H1", titleStyle)

	// 设置表头
	row := 3
	headers := []string{"序号", "员工姓名", "考核模板", "考核周期", "总分", "状态", "创建时间", "最后更新"}
	for i, header := range headers {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"#E6E6FA"},
			Pattern: 1,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})
	for i := 0; i < len(headers); i++ {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// 设置数据
	for idx, evaluation := range evaluations {
		row++
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), idx+1)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), evaluation.Employee.Name)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), evaluation.Template.Name)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), evaluation.Period)
		f.SetCellValue(sheetName, "E"+strconv.Itoa(row), evaluation.TotalScore)
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), getStatusText(evaluation.Status))
		f.SetCellValue(sheetName, "G"+strconv.Itoa(row), evaluation.CreatedAt.Format("2006-01-02 15:04:05"))
		f.SetCellValue(sheetName, "H"+strconv.Itoa(row), evaluation.UpdatedAt.Format("2006-01-02 15:04:05"))

		// 设置数据行样式
		dataStyle, _ := f.NewStyle(&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
			},
		})
		for i := 0; i < len(headers); i++ {
			cell := string(rune('A'+i)) + strconv.Itoa(row)
			f.SetCellStyle(sheetName, cell, cell, dataStyle)
		}
	}

	// 设置列宽
	f.SetColWidth(sheetName, "A", "A", 8)
	f.SetColWidth(sheetName, "B", "B", 15)
	f.SetColWidth(sheetName, "C", "C", 25)
	f.SetColWidth(sheetName, "D", "D", 15)
	f.SetColWidth(sheetName, "E", "E", 10)
	f.SetColWidth(sheetName, "F", "F", 15)
	f.SetColWidth(sheetName, "G", "G", 20)
	f.SetColWidth(sheetName, "H", "H", 20)

	// 创建公共导出目录
	exportDir := "./public/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建导出目录失败",
		})
		return
	}

	// 生成文件名
	fileName := fmt.Sprintf("部门评估汇总-%s-%d.xlsx",
		department.Name,
		time.Now().Unix())
	filePath := filepath.Join(exportDir, fileName)

	// 保存文件
	if err := f.SaveAs(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 获取文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取文件信息失败",
		})
		return
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/download/exports/%s", fileName))

	c.JSON(http.StatusOK, ExportResponse{
		FileURL:  downloadURL,
		FileName: fileName,
		FileSize: fileInfo.Size(),
		Message:  "导出成功",
	})

	// 30分钟后删除文件
	go func() {
		time.Sleep(time.Minute * 30)
		os.Remove(filePath)
	}()
}

// 导出周期评估统计
func ExportPeriodToExcel(c *gin.Context) {
	period := c.Param("period")
	year := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
	month := c.DefaultQuery("month", "")
	quarter := c.DefaultQuery("quarter", "")

	var evaluations []models.KPIEvaluation
	query := models.DB.Preload("Employee.Department").Preload("Template")

	// 根据周期类型筛选
	if period == "monthly" && month != "" {
		query = query.Where("year = ? AND month = ?", year, month)
	} else if period == "quarterly" && quarter != "" {
		q, _ := strconv.Atoi(quarter)
		startMonth := (q-1)*3 + 1
		endMonth := q * 3
		query = query.Where("year = ? AND month BETWEEN ? AND ?", year, startMonth, endMonth)
	} else if period == "yearly" {
		query = query.Where("year = ?", year)
	}

	result := query.Find(&evaluations)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取周期评估数据失败",
		})
		return
	}

	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	sheetName := "周期评估统计"
	f.SetSheetName("Sheet1", sheetName)

	// 构建标题
	var title string
	switch period {
	case "monthly":
		title = fmt.Sprintf("%s年%s月 评估统计报告", year, month)
	case "quarterly":
		title = fmt.Sprintf("%s年第%s季度 评估统计报告", year, quarter)
	case "yearly":
		title = fmt.Sprintf("%s年度 评估统计报告", year)
	default:
		title = "评估统计报告"
	}

	// 设置标题
	f.SetCellValue(sheetName, "A1", title)
	f.MergeCell(sheetName, "A1", "I1")

	// 设置标题样式
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 16,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	f.SetCellStyle(sheetName, "A1", "I1", titleStyle)

	// 设置表头
	row := 3
	headers := []string{"序号", "员工姓名", "部门", "考核模板", "考核周期", "总分", "状态", "创建时间", "最后更新"}
	for i, header := range headers {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"#E6E6FA"},
			Pattern: 1,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})
	for i := 0; i < len(headers); i++ {
		cell := string(rune('A'+i)) + strconv.Itoa(row)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// 设置数据
	for idx, evaluation := range evaluations {
		row++
		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), idx+1)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), evaluation.Employee.Name)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), evaluation.Employee.Department.Name)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), evaluation.Template.Name)
		f.SetCellValue(sheetName, "E"+strconv.Itoa(row), evaluation.Period)
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), evaluation.TotalScore)
		f.SetCellValue(sheetName, "G"+strconv.Itoa(row), getStatusText(evaluation.Status))
		f.SetCellValue(sheetName, "H"+strconv.Itoa(row), evaluation.CreatedAt.Format("2006-01-02 15:04:05"))
		f.SetCellValue(sheetName, "I"+strconv.Itoa(row), evaluation.UpdatedAt.Format("2006-01-02 15:04:05"))

		// 设置数据行样式
		dataStyle, _ := f.NewStyle(&excelize.Style{
			Border: []excelize.Border{
				{Type: "left", Color: "000000", Style: 1},
				{Type: "top", Color: "000000", Style: 1},
				{Type: "bottom", Color: "000000", Style: 1},
				{Type: "right", Color: "000000", Style: 1},
			},
		})
		for i := 0; i < len(headers); i++ {
			cell := string(rune('A'+i)) + strconv.Itoa(row)
			f.SetCellStyle(sheetName, cell, cell, dataStyle)
		}
	}

	// 设置列宽
	f.SetColWidth(sheetName, "A", "A", 8)
	f.SetColWidth(sheetName, "B", "B", 15)
	f.SetColWidth(sheetName, "C", "C", 15)
	f.SetColWidth(sheetName, "D", "D", 25)
	f.SetColWidth(sheetName, "E", "E", 15)
	f.SetColWidth(sheetName, "F", "F", 10)
	f.SetColWidth(sheetName, "G", "G", 15)
	f.SetColWidth(sheetName, "H", "H", 20)
	f.SetColWidth(sheetName, "I", "I", 20)

	// 创建公共导出目录
	exportDir := "./public/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建导出目录失败",
		})
		return
	}

	// 生成文件名
	fileName := fmt.Sprintf("周期评估统计-%s-%s-%d.xlsx",
		period,
		year,
		time.Now().Unix())
	filePath := filepath.Join(exportDir, fileName)

	// 保存文件
	if err := f.SaveAs(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 获取文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取文件信息失败",
		})
		return
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/download/exports/%s", fileName))

	c.JSON(http.StatusOK, ExportResponse{
		FileURL:  downloadURL,
		FileName: fileName,
		FileSize: fileInfo.Size(),
		Message:  "导出成功",
	})

	// 30分钟后删除文件
	go func() {
		time.Sleep(time.Minute * 30)
		os.Remove(filePath)
	}()
}

// 文件下载处理
func DownloadFile(c *gin.Context) {
	fileName := c.Param("filename")
	filePath := filepath.Join("./public/exports", fileName)

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "文件不存在",
		})
		return
	}

	// 设置响应头
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

	// 返回文件
	c.File(filePath)
}

// 获取状态文本
func getStatusText(status string) string {
	switch status {
	case "pending":
		return "待自评"
	case "self_evaluated":
		return "待主管评估"
	case "manager_evaluated":
		return "待HR审核"
	case "pending_confirm":
		return "待确认"
	case "completed":
		return "已完成"
	default:
		return "未知状态"
	}
}
