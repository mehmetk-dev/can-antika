package com.mehmetkerem.event;

import org.springframework.context.ApplicationEvent;

public class UserRegisteredEvent extends ApplicationEvent {
    private final String email;
    private final String name;

    public UserRegisteredEvent(Object source, String email, String name) {
        super(source);
        this.email = email;
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }
}
