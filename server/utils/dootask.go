package utils

import (
	"errors"

	dootask "github.com/dootask/tools/server/go"
)

type DooTaskClient struct {
	Client *dootask.Client
}

// NewDooTaskClient 创建 DooTask 客户端
func NewDooTaskClient(token string) DooTaskClient {
	return DooTaskClient{Client: dootask.NewClient(token)}
}

// SendBotMessage 发送 DooTask 机器人通知
func (d *DooTaskClient) SendBotMessage(userID *uint, message string) error {
	if userID == nil || *userID == 0 {
		return errors.New("userID is required")
	}

	return nil
}
