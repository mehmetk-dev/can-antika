package com.mehmetkerem.util;

import com.lowagie.text.Font;

import java.awt.*;

/**
 * Fatura PDF stilleri — font, renk ve sabit değerler.
 */
public final class PdfStyleConstants {

    private PdfStyleConstants() {}

    // ── Fonts ──
    public static final Font TITLE_FONT  = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(44, 62, 80));
    public static final Font HEADER_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);
    public static final Font BODY_FONT   = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
    public static final Font BOLD_FONT   = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
    public static final Font SMALL_FONT  = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY);

    // ── Colors ──
    public static final Color PRIMARY_COLOR = new Color(52, 73, 94);
    public static final Color STRIPE_COLOR  = new Color(241, 245, 249);
    public static final Color BORDER_COLOR  = new Color(220, 220, 220);

    // ── Totals font ──
    public static final Font TOTAL_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, PRIMARY_COLOR);
}
