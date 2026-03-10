package com.mehmetkerem.controller;

import com.mehmetkerem.dto.response.NotificationResponse;
import com.mehmetkerem.util.ResultData;

import java.util.List;
import java.util.Map;

public interface IRestNotificationController {
    ResultData<List<NotificationResponse>> getMyNotifications();

    ResultData<Map<String, Long>> getUnreadCount();

    ResultData<String> markAsRead(Long id);

    ResultData<String> markAllAsRead();
}
