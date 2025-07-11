package handlers

import (
	"net/http"
	"strconv"

	"dootask-kpi-server/models"

	"github.com/gin-gonic/gin"
)

// KPI项目管理

// 创建KPI项目
func CreateItem(c *gin.Context) {
	var item models.KPIItem

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result := models.DB.Create(&item)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "创建KPI项目失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "KPI项目创建成功",
		"data":    item,
	})
}

// 获取KPI项目
func GetItem(c *gin.Context) {
	id := c.Param("id")
	itemId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的项目ID",
		})
		return
	}

	var item models.KPIItem
	result := models.DB.Preload("Template").First(&item, itemId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "KPI项目不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// 更新KPI项目
func UpdateItem(c *gin.Context) {
	id := c.Param("id")
	itemId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的项目ID",
		})
		return
	}

	var item models.KPIItem
	result := models.DB.First(&item, itemId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "KPI项目不存在",
		})
		return
	}

	var updateData models.KPIItem
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&item).Updates(updateData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新KPI项目失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "KPI项目更新成功",
		"data":    item,
	})
}

// 删除KPI项目
func DeleteItem(c *gin.Context) {
	id := c.Param("id")
	itemId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的项目ID",
		})
		return
	}

	result := models.DB.Delete(&models.KPIItem{}, itemId)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "删除KPI项目失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "KPI项目删除成功",
	})
}

// KPI评估管理

// 获取所有评估
func GetEvaluations(c *gin.Context) {
	var evaluations []models.KPIEvaluation

	result := models.DB.Preload("Employee.Department").Preload("Template").Preload("Scores").Find(&evaluations)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取评估列表失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  evaluations,
		"total": len(evaluations),
	})
}

// 创建评估
func CreateEvaluation(c *gin.Context) {
	var evaluation models.KPIEvaluation

	if err := c.ShouldBindJSON(&evaluation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	// 开始数据库事务
	tx := models.DB.Begin()

	// 创建评估记录
	result := tx.Create(&evaluation)
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "创建评估失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 获取模板的所有KPI项目
	var items []models.KPIItem
	tx.Where("template_id = ?", evaluation.TemplateID).Find(&items)

	// 为每个KPI项目创建评分记录
	for _, item := range items {
		score := models.KPIScore{
			EvaluationID: evaluation.ID,
			ItemID:       item.ID,
		}
		if err := tx.Create(&score).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "创建评分记录失败",
				"message": err.Error(),
			})
			return
		}
	}

	tx.Commit()

	// 获取完整的评估信息
	models.DB.Preload("Employee.Department").Preload("Template").Preload("Scores").First(&evaluation, evaluation.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "评估创建成功",
		"data":    evaluation,
	})
}

// 获取单个评估
func GetEvaluation(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{
		"data": evaluation,
	})
}

// 更新评估
func UpdateEvaluation(c *gin.Context) {
	id := c.Param("id")
	evaluationId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评估ID",
		})
		return
	}

	var evaluation models.KPIEvaluation
	result := models.DB.First(&evaluation, evaluationId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "评估不存在",
		})
		return
	}

	var updateData models.KPIEvaluation
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&evaluation).Updates(updateData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新评估失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 如果状态变为completed，自动计算最终得分
	if updateData.Status == "completed" {
		var scores []models.KPIScore
		if err := models.DB.Where("evaluation_id = ?", evaluation.ID).Find(&scores).Error; err == nil {
			total := 0.0
			for _, s := range scores {
				var final float64
				if s.ManagerScore != nil {
					final = *s.ManagerScore
				} else if s.SelfScore != nil {
					final = *s.SelfScore
				}
				models.DB.Model(&s).Update("final_score", final)
				total += final
			}
			models.DB.Model(&evaluation).Update("total_score", total)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "评估更新成功",
		"data":    evaluation,
	})
}

// 删除评估
func DeleteEvaluation(c *gin.Context) {
	id := c.Param("id")
	evaluationId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评估ID",
		})
		return
	}

	// 删除相关的评分记录
	models.DB.Where("evaluation_id = ?", evaluationId).Delete(&models.KPIScore{})

	result := models.DB.Delete(&models.KPIEvaluation{}, evaluationId)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "删除评估失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "评估删除成功",
	})
}

// 获取员工的评估记录
func GetEmployeeEvaluations(c *gin.Context) {
	employeeId := c.Param("employeeId")
	empId, err := strconv.ParseUint(employeeId, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var evaluations []models.KPIEvaluation
	result := models.DB.Preload("Template").Preload("Scores").Where("employee_id = ?", empId).Find(&evaluations)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取员工评估记录失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  evaluations,
		"total": len(evaluations),
	})
}

// 获取待处理的评估
func GetPendingEvaluations(c *gin.Context) {
	employeeId := c.Param("employeeId")
	empId, err := strconv.ParseUint(employeeId, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var evaluations []models.KPIEvaluation

	// 获取需要当前员工处理的评估
	result := models.DB.Preload("Employee.Department").Preload("Template").Where("employee_id = ? AND status IN ?", empId, []string{"pending", "self_evaluated"}).Find(&evaluations)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取待处理评估失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  evaluations,
		"total": len(evaluations),
	})
}

// 获取评估的评分记录
func GetEvaluationScores(c *gin.Context) {
	evaluationId := c.Param("evaluationId")
	evalId, err := strconv.ParseUint(evaluationId, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评估ID",
		})
		return
	}

	var scores []models.KPIScore
	result := models.DB.Preload("Item").Where("evaluation_id = ?", evalId).Find(&scores)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取评分记录失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  scores,
		"total": len(scores),
	})
}

// 更新自评分数
func UpdateSelfScore(c *gin.Context) {
	id := c.Param("id")
	scoreId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评分ID",
		})
		return
	}

	var score models.KPIScore
	result := models.DB.First(&score, scoreId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "评分记录不存在",
		})
		return
	}

	var updateData struct {
		SelfScore   *float64 `json:"self_score"`
		SelfComment string   `json:"self_comment"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&score).Updates(map[string]interface{}{
		"self_score":   updateData.SelfScore,
		"self_comment": updateData.SelfComment,
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新自评分数失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 如果该评分所属考核的员工没有主管且当前状态是自评，则自动流转
	var evaluation models.KPIEvaluation
	if err := models.DB.Preload("Employee").Where("status = ?", "self_evaluated").First(&evaluation, score.EvaluationID).Error; err == nil {
		if evaluation.Employee.ManagerID == nil {
			// 没有主管，自动将所有评分的manager_score设为self_score
			var scores []models.KPIScore
			if err := models.DB.Where("evaluation_id = ?", evaluation.ID).Find(&scores).Error; err == nil {
				for _, s := range scores {
					if s.SelfScore != nil {
						models.DB.Model(&s).Updates(map[string]interface{}{
							"manager_score":   s.SelfScore,
							"manager_comment": "无主管，自动确认",
						})
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "自评分数更新成功",
		"data":    score,
	})
}

// 更新上级评分
func UpdateManagerScore(c *gin.Context) {
	id := c.Param("id")
	scoreId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评分ID",
		})
		return
	}

	var score models.KPIScore
	result := models.DB.First(&score, scoreId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "评分记录不存在",
		})
		return
	}

	var updateData struct {
		ManagerScore   *float64 `json:"manager_score"`
		ManagerComment string   `json:"manager_comment"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&score).Updates(map[string]interface{}{
		"manager_score":   updateData.ManagerScore,
		"manager_comment": updateData.ManagerComment,
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新上级评分失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "上级评分更新成功",
		"data":    score,
	})
}

// 更新最终得分
func UpdateFinalScore(c *gin.Context) {
	id := c.Param("id")
	scoreId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的评分ID",
		})
		return
	}

	var score models.KPIScore
	result := models.DB.First(&score, scoreId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "评分记录不存在",
		})
		return
	}

	var updateData struct {
		FinalScore *float64 `json:"final_score"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&score).Updates(map[string]interface{}{
		"final_score": updateData.FinalScore,
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新最终得分失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "最终得分更新成功",
		"data":    score,
	})
}
