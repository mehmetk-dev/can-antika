package com.mehmetkerem.handler;

import com.mehmetkerem.util.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    @Test
    @DisplayName("Optimistic locking hatasinda 409 doner")
    void handleOptimisticLockingFailure_ShouldReturnConflict() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<Result> response = handler.handleOptimisticLockingFailure(
                new ObjectOptimisticLockingFailureException("Order", 1L));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("409", response.getBody().getCode());
    }
}
