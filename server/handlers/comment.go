package handlers

import (
	"net/http"
	"strconv"

	"dootask-kpi-server/models"

	"github.com/gin-gonic/gin"
)

// 获取评估评论列表
func GetEvaluationComments(c *gin.Context) {
	evaluationID := c.Param("id")

	// 当前用户ID（暂时硬编码，实际应从JWT token获取）
	currentUserID := uint(1)

	var comments []models.EvaluationComment

	// 构建查询条件
	query := models.DB.Where("evaluation_id = ?", evaluationID)

	// 如果不是管理员，只显示公开评论和自己的私有评论
	// 这里简化处理，假设所有用户都可以看到公开评论
	query = query.Where("is_private = ? OR user_id = ?", false, currentUserID)

	// 预加载用户信息
	if err := query.Preload("User").Order("created_at DESC").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取评论失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取评论成功",
		"data":    comments,
	})
}

// 创建评论
func CreateEvaluationComment(c *gin.Context) {
	evaluationID := c.Param("id")

	// 当前用户ID（暂时硬编码，实际应从JWT token获取）
	currentUserID := uint(1)

	var req struct {
		Content   string `json:"content" binding:"required"`
		IsPrivate bool   `json:"is_private"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证评估记录是否存在
	var evaluation models.KPIEvaluation
	if err := models.DB.First(&evaluation, evaluationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评估记录不存在"})
		return
	}

	// 创建评论
	evalID, _ := strconv.ParseUint(evaluationID, 10, 32)
	comment := models.EvaluationComment{
		EvaluationID: uint(evalID),
		UserID:       currentUserID,
		Content:      req.Content,
		IsPrivate:    req.IsPrivate,
	}

	if err := models.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建评论失败"})
		return
	}

	// 预加载用户信息后返回
	models.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "评论创建成功",
		"data":    comment,
	})
}

// 更新评论
func UpdateEvaluationComment(c *gin.Context) {
	commentID := c.Param("comment_id")

	// 当前用户ID（暂时硬编码，实际应从JWT token获取）
	currentUserID := uint(1)

	var req struct {
		Content   string `json:"content" binding:"required"`
		IsPrivate bool   `json:"is_private"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找评论
	var comment models.EvaluationComment
	if err := models.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	// 检查权限：只有评论作者可以编辑
	if comment.UserID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限编辑此评论"})
		return
	}

	// 更新评论
	comment.Content = req.Content
	comment.IsPrivate = req.IsPrivate

	if err := models.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新评论失败"})
		return
	}

	// 预加载用户信息后返回
	models.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "评论更新成功",
		"data":    comment,
	})
}

// 删除评论
func DeleteEvaluationComment(c *gin.Context) {
	commentID := c.Param("comment_id")

	// 当前用户ID（暂时硬编码，实际应从JWT token获取）
	currentUserID := uint(1)

	// 查找评论
	var comment models.EvaluationComment
	if err := models.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	// 检查权限：只有评论作者可以删除
	if comment.UserID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限删除此评论"})
		return
	}

	// 删除评论
	if err := models.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除评论失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "评论删除成功",
	})
}
