package handlers

import (
	"net/http"
	"strconv"

	"dootask-kpi-server/models"

	"github.com/gin-gonic/gin"
)

// 获取所有员工
func GetEmployees(c *gin.Context) {
	var employees []models.Employee

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	search := c.Query("search")

	// 验证分页参数
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// 构建查询
	query := models.DB.Preload("Department").Preload("Manager")

	// 添加搜索条件
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name LIKE ? OR email LIKE ? OR position LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// 获取总数
	var total int64
	countQuery := models.DB.Model(&models.Employee{})
	if search != "" {
		searchPattern := "%" + search + "%"
		countQuery = countQuery.Where("name LIKE ? OR email LIKE ? OR position LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	if err := countQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取员工总数失败",
			"message": err.Error(),
		})
		return
	}

	// 分页查询
	offset := (page - 1) * pageSize
	result := query.Offset(offset).Limit(pageSize).Find(&employees)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取员工列表失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 计算分页信息
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	c.JSON(http.StatusOK, gin.H{
		"data":       employees,
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
		"hasNext":    page < totalPages,
		"hasPrev":    page > 1,
	})
}

// 创建员工
func CreateEmployee(c *gin.Context) {
	var employee models.Employee

	if err := c.ShouldBindJSON(&employee); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result := models.DB.Create(&employee)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "创建员工失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 获取完整的员工信息
	models.DB.Preload("Department").Preload("Manager").First(&employee, employee.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "员工创建成功",
		"data":    employee,
	})
}

// 获取单个员工
func GetEmployee(c *gin.Context) {
	id := c.Param("id")
	employeeId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var employee models.Employee
	result := models.DB.Preload("Department").Preload("Manager").Preload("Subordinates").First(&employee, employeeId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "员工不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": employee,
	})
}

// 更新员工
func UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	employeeId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var employee models.Employee
	result := models.DB.First(&employee, employeeId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "员工不存在",
		})
		return
	}

	var updateData models.Employee
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&employee).Updates(updateData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新员工失败",
			"message": result.Error.Error(),
		})
		return
	}

	// 获取完整的员工信息
	models.DB.Preload("Department").Preload("Manager").First(&employee, employee.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "员工更新成功",
		"data":    employee,
	})
}

// 删除员工
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")
	employeeId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	// 检查是否有下属员工
	var subordinateCount int64
	models.DB.Model(&models.Employee{}).Where("manager_id = ?", employeeId).Count(&subordinateCount)
	if subordinateCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "该员工还有下属，无法删除",
		})
		return
	}

	// 检查是否有相关的KPI评估记录
	var evaluationCount int64
	models.DB.Model(&models.KPIEvaluation{}).Where("employee_id = ?", employeeId).Count(&evaluationCount)
	if evaluationCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "该员工有KPI评估记录，无法删除",
		})
		return
	}

	result := models.DB.Delete(&models.Employee{}, employeeId)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "删除员工失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "员工删除成功",
	})
}

// 获取员工的下属列表
func GetEmployeeSubordinates(c *gin.Context) {
	id := c.Param("id")
	employeeId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的员工ID",
		})
		return
	}

	var subordinates []models.Employee
	result := models.DB.Preload("Department").Where("manager_id = ?", employeeId).Find(&subordinates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取下属列表失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  subordinates,
		"total": len(subordinates),
	})
}
