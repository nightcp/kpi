package routes

import (
	"dootask-kpi-server/handlers"

	"github.com/gin-gonic/gin"
)

// 设置所有路由
func SetupRoutes(r *gin.RouterGroup) {
	// 部门管理
	departmentRoutes := r.Group("/departments")
	{
		departmentRoutes.GET("", handlers.GetDepartments)
		departmentRoutes.POST("", handlers.CreateDepartment)
		departmentRoutes.GET("/:id", handlers.GetDepartment)
		departmentRoutes.PUT("/:id", handlers.UpdateDepartment)
		departmentRoutes.DELETE("/:id", handlers.DeleteDepartment)
	}

	// 员工管理
	employeeRoutes := r.Group("/employees")
	{
		employeeRoutes.GET("", handlers.GetEmployees)
		employeeRoutes.POST("", handlers.CreateEmployee)
		employeeRoutes.GET("/:id", handlers.GetEmployee)
		employeeRoutes.PUT("/:id", handlers.UpdateEmployee)
		employeeRoutes.DELETE("/:id", handlers.DeleteEmployee)
		employeeRoutes.GET("/:id/subordinates", handlers.GetEmployeeSubordinates)
	}

	// KPI模板管理
	templateRoutes := r.Group("/templates")
	{
		templateRoutes.GET("", handlers.GetTemplates)
		templateRoutes.POST("", handlers.CreateTemplate)
		templateRoutes.GET("/:id", handlers.GetTemplate)
		templateRoutes.PUT("/:id", handlers.UpdateTemplate)
		templateRoutes.DELETE("/:id", handlers.DeleteTemplate)
		templateRoutes.GET("/:id/items", handlers.GetTemplateItems)
	}

	// KPI考核项目管理
	itemRoutes := r.Group("/items")
	{
		itemRoutes.POST("", handlers.CreateItem)
		itemRoutes.GET("/:id", handlers.GetItem)
		itemRoutes.PUT("/:id", handlers.UpdateItem)
		itemRoutes.DELETE("/:id", handlers.DeleteItem)
	}

	// KPI评估管理
	evaluationRoutes := r.Group("/evaluations")
	{
		evaluationRoutes.GET("", handlers.GetEvaluations)
		evaluationRoutes.POST("", handlers.CreateEvaluation)
		evaluationRoutes.GET("/:id", handlers.GetEvaluation)
		evaluationRoutes.PUT("/:id", handlers.UpdateEvaluation)
		evaluationRoutes.DELETE("/:id", handlers.DeleteEvaluation)
		evaluationRoutes.GET("/employee/:employeeId", handlers.GetEmployeeEvaluations)
		evaluationRoutes.GET("/pending/:employeeId", handlers.GetPendingEvaluations)
	}

	// KPI评分管理
	scoreRoutes := r.Group("/scores")
	{
		scoreRoutes.GET("/evaluation/:evaluationId", handlers.GetEvaluationScores)
		scoreRoutes.PUT("/:id/self", handlers.UpdateSelfScore)
		scoreRoutes.PUT("/:id/manager", handlers.UpdateManagerScore)
		scoreRoutes.PUT("/:id/final", handlers.UpdateFinalScore)
	}

	// 统计分析
	statsRoutes := r.Group("/statistics")
	{
		statsRoutes.GET("/dashboard", handlers.GetDashboardStats)
		statsRoutes.GET("/department/:id", handlers.GetDepartmentStats)
		statsRoutes.GET("/employee/:id", handlers.GetEmployeeStats)
		statsRoutes.GET("/trends", handlers.GetTrends)
	}

	// 导出功能
	exportRoutes := r.Group("/export")
	{
		exportRoutes.GET("/evaluation/:id", handlers.ExportEvaluation)
		exportRoutes.GET("/department/:id", handlers.ExportDepartmentEvaluations)
		exportRoutes.GET("/period/:period", handlers.ExportPeriodEvaluations)
	}
}
