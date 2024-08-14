import { html, unsafeHtml } from '@prairielearn/html';

import { RubricData, RubricGradingData } from '../../../lib/manualGrading.js';

export function RubricInputSection({
  resLocals,
  disable,
}: {
  resLocals: Record<string, any>;
  disable: boolean;
}) {
  if (!resLocals.rubric_data) return '';
  const rubric_data: RubricData = resLocals.rubric_data;
  const rubric_grading: RubricGradingData | null = resLocals.submission.rubric_grading;
  const pointsRatio: number = !rubric_data.total_points
    ? 0
    : (rubric_data.replace_auto_points || !resLocals.assessment_question.max_manual_points
        ? resLocals.assessment_question.max_points
        : resLocals.assessment_question.max_manual_points) / rubric_data.total_points;

  return html`
    <input type="hidden" name="score_manual_adjust_points_ratio" value="${pointsRatio}" />
    ${rubric_data.rubric_items?.map(
      (item) => html`
        <div>
          <label class="js-selectable-rubric-item-label w-100">
            <input
              type="checkbox"
              name="rubric_item_selected_manual"
              class="js-selectable-rubric-item"
              value="${item.id}"
              ${rubric_grading?.rubric_items?.[item.id]?.score ? 'checked' : ''}
              ${disable ? 'disabled' : ''}
              data-rubric-item-points="${item.points * pointsRatio}"
              data-key-binding="${item.key_binding}"
            />
            <span class="badge badge-info">${item.key_binding}</span>
            <span class="float-right text-${item.points >= 0 ? 'success' : 'danger'}">
              <strong>
                <span class="js-manual-grading-points" data-testid="rubric-item-points">
                  [${(item.points >= 0 ? '+' : '') +
                  Math.round(item.points * pointsRatio * 100) / 100}]
                </span>
                ${resLocals.assessment_question.max_points
                  ? html`
                      <span class="js-manual-grading-percentage">
                        [${(item.points >= 0 ? '+' : '') +
                        Math.round((item.points * 10000) / (rubric_data.total_points || 1)) / 100}%]
                      </span>
                    `
                  : ''}
              </strong>
            </span>
            <span>
              <div class="d-inline-block" data-testid="rubric-item-description">
                ${unsafeHtml(item.description_rendered ?? '')}
              </div>
              <div class="small text-muted" data-testid="rubric-item-explanation">
                ${unsafeHtml(item.explanation_rendered ?? '')}
              </div>
              <div class="small text-muted" data-testid="rubric-item-grader-note">
                ${unsafeHtml(item.grader_note_rendered ?? '')}
              </div>
            </span>
          </label>
        </div>
      `,
    )}
    <div class="js-adjust-points d-flex justify-content-end">
      <button
        type="button"
        class="js-adjust-points-enable btn btn-sm btn-link ${rubric_grading?.adjust_points ||
        disable
          ? 'd-none'
          : ''}"
      >
        Apply adjustment
      </button>
      <div
        class="js-adjust-points-input-container w-25 ${rubric_grading?.adjust_points
          ? ''
          : 'd-none'}"
      >
        <label>
          <span class="small">Adjustment:</span>
          <div class="js-manual-grading-points">
            <div class="input-group input-group-sm">
              <input
                type="number"
                step="any"
                class="form-control js-adjust-points-points"
                name="score_manual_adjust_points"
                data-max-points="${resLocals.assessment_question.max_manual_points ||
                resLocals.assessment_question.max_points}"
                value="${Math.round((rubric_grading?.adjust_points ?? 0) * pointsRatio * 100) /
                  100 || ''}"
                ${disable ? 'disabled' : ''}
              />
            </div>
          </div>
          ${resLocals.assessment_question.max_points
            ? html`
                <div class="js-manual-grading-percentage">
                  <div class="input-group input-group-sm">
                    <input
                      type="number"
                      step="any"
                      class="form-control js-adjust-points-percentage"
                      name="score_manual_adjust_percent"
                      data-max-points="${resLocals.assessment_question.max_manual_points ||
                      resLocals.assessment_question.max_points}"
                      value="${Math.round(
                        ((rubric_grading?.adjust_points || 0) * 10000) /
                          (rubric_data.total_points || 1),
                      ) / 100 || ''}"
                      ${disable ? 'disabled' : ''}
                    />
                    <span class="input-group-append">
                      <span class="input-group-text">%</span>
                    </span>
                  </div>
                </div>
              `
            : ''}
        </label>
      </div>
    </div>
  `;
}
