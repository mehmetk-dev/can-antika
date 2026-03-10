package com.mehmetkerem.event;

import org.springframework.context.ApplicationEvent;

public class ForgotPasswordEvent extends ApplicationEvent {
    private final String email;
    private final String link;

    public ForgotPasswordEvent(Object source, String email, String link) {
        super(source);
        this.email = email;
        this.link = link;
    }

    public String getEmail() {
        return email;
    }

    public String getLink() {
        return link;
    }
}
