package handlers

import (
	"net/http"
	"strconv"

	"dootask-kpi-server/models"

	"github.com/gin-gonic/gin"
)

// 获取所有部门
func GetDepartments(c *gin.Context) {
	var departments []models.Department

	result := models.DB.Preload("Employees").Find(&departments)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取部门列表失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  departments,
		"total": len(departments),
	})
}

// 创建部门
func CreateDepartment(c *gin.Context) {
	var department models.Department

	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result := models.DB.Create(&department)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "创建部门失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "部门创建成功",
		"data":    department,
	})
}

// 获取单个部门
func GetDepartment(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	var department models.Department
	result := models.DB.Preload("Employees").First(&department, departmentId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "部门不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": department,
	})
}

// 更新部门
func UpdateDepartment(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	var department models.Department
	result := models.DB.First(&department, departmentId)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "部门不存在",
		})
		return
	}

	var updateData models.Department
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "请求参数错误",
			"message": err.Error(),
		})
		return
	}

	result = models.DB.Model(&department).Updates(updateData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "更新部门失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "部门更新成功",
		"data":    department,
	})
}

// 删除部门
func DeleteDepartment(c *gin.Context) {
	id := c.Param("id")
	departmentId, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的部门ID",
		})
		return
	}

	// 检查是否有员工在该部门
	var employeeCount int64
	models.DB.Model(&models.Employee{}).Where("department_id = ?", departmentId).Count(&employeeCount)
	if employeeCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "该部门下还有员工，无法删除",
		})
		return
	}

	result := models.DB.Delete(&models.Department{}, departmentId)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "删除部门失败",
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "部门删除成功",
	})
}
