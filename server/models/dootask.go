package models

import (
	"errors"

	dootask "github.com/dootask/tools/server/go"
	"github.com/gin-gonic/gin"
)

// SendBotMessage 发送 DooTask 机器人通知
func SendBotMessage(c *gin.Context, userID *uint, message string) error {
	if userID == nil || *userID == 0 {
		return errors.New("userID is required")
	}

	dooTaskToken := c.GetHeader("DooTaskAuth")
	if dooTaskToken == "" {
		return errors.New("dooTaskToken is required")
	}

	dooTaskClient := dootask.NewClient(dooTaskToken)

	return dooTaskClient.SendBotMessage(dootask.SendBotMessageRequest{
		UserID:  int(*userID),
		Text:    message,
		BotType: "dootask-kpi",
		BotName: "KPI 绩效考核",
	})
}
