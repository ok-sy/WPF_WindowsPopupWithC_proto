package server.domain.popup;
/**
 * ■ 문항 템플릿 요약
 * - in : templateId(Long) · templateName(String) · templateType(String)
 * - out: 관리자 화면의 문항 템플릿 1건(record)
 */
public record AdminQuestionTemplate(Long templateId, String templateName, String templateType) {}
