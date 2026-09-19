# Popup preview and WPF parity checklist

The administrator preview follows the rendering contract used by
`popup-frameWork/Popup`.

| Area | WPF source | Web preview behavior |
| --- | --- | --- |
| Window size | `PopupWindow.ApplyWindowSize` | FIXED, RATIO and FULLSCREEN with min/max bounds |
| Header and close | `PopupWindow.ApplyOptions` | The close button is visible only when both header and close are enabled |
| Footer | `PopupWindow.ApplyOptions` | Footer and do-not-show-again checkbox follow their flags |
| Text | `TextPopupView` | Two cards, highlight text and additional description |
| Image | `ImagePopupView` | Image URL, description flag and requested image bounds |
| Video | `VideoPopupView` | Description, controls, fullscreen/rate flags, volume and completion ratio |
| Survey/quiz | `SurveyPopupView` | Actual questions, descriptions, required state and options |

## Manual visual verification

1. Run the API, web administrator and WPF client against the same database.
2. Open one popup of each type in the administrator editor.
3. Select **새 창으로 보기** and capture the web preview.
4. Delete the user's `user_popup_status` row when the popup is hidden.
5. Run the WPF client with the same `userId` and capture the popup.
6. Compare header/footer visibility, content order, scrolling and window size.

The web preview is a browser representation. Font metrics, native media controls,
window chrome and DPI rounding can differ slightly from WPF even when the same
configuration is applied.
