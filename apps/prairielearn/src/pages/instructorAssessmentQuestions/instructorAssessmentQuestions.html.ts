import { EncodedData } from '@prairielearn/browser-utils';
import { html } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { AssessmentBadge } from '../../components/AssessmentBadge.html.js';
import { HeadContents } from '../../components/HeadContents.html.js';
import { IssueBadge } from '../../components/IssueBadge.html.js';
import { Modal } from '../../components/Modal.html.js';
import { Navbar } from '../../components/Navbar.html.js';
import { AssessmentSyncErrorsAndWarnings } from '../../components/SyncErrorsAndWarnings.html.js';
import { TagBadgeList } from '../../components/TagBadge.html.js';
import { TopicBadge } from '../../components/TopicBadge.html.js';
import { compiledScriptTag } from '../../lib/assets.js';

import { DeleteQuestionModal } from './deleteQuestionModal.html.js';
import { EditQuestionModal } from './editQuestionModal.html.js';
import { EditZoneModal } from './editZoneModal.html.js';
import { AssessmentQuestionRow } from './instructorAssessmentQuestions.types.js';

export function InstructorAssessmentQuestions({
  resLocals,
  questions,
  origHash,
  assessmentQuestionEditorEnabled,
}: {
  resLocals: Record<string, any>;
  questions: AssessmentQuestionRow[];
  origHash: string;
  assessmentQuestionEditorEnabled: boolean;
}) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        ${HeadContents({ resLocals })}
        ${compiledScriptTag('instructorAssessmentQuestionsClient.ts')}
      </head>
      <body>
        ${EncodedData(questions, 'assessment-questions-data')} ${Navbar({ resLocals })}
        <main id="content" class="container-fluid">
          ${Modal({
            id: 'resetQuestionVariantsModal',
            title: 'Confirm reset question variants',
            body: html`
              <p>
                Are your sure you want to reset all current variants of this question?
                <strong>All ungraded attempts will be lost.</strong>
              </p>
              <p>Students will receive a new variant the next time they view this question.</p>
            `,
            footer: html`
              <input type="hidden" name="__action" value="reset_question_variants" />
              <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
              <input
                type="hidden"
                name="unsafe_assessment_question_id"
                class="js-assessment-question-id"
                value=""
              />
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-danger">Reset question variants</button>
            `,
          })}
          ${DeleteQuestionModal({ zoneIndex: 0, questionIndex: 0 })}
          ${EditQuestionModal({
            newQuestion: true,
            zoneIndex: 0,
            questionIndex: 0,
            assessmentType: resLocals.assessment.type,
          })}
          ${EditZoneModal({ zone: {}, newZone: false, zoneIndex: 0 })}
          <div id="findQIDModal"></div>
          <form method="POST" id="zonesForm">
            <input type="hidden" name="__action" value="edit_assessment_questions" />
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <input type="hidden" name="__orig_hash" value="${origHash}" />
            <input type="hidden" name="zones" value="" />
          </form>
          ${AssessmentSyncErrorsAndWarnings({
            authz_data: resLocals.authz_data,
            assessment: resLocals.assessment,
            courseInstance: resLocals.course_instance,
            course: resLocals.course,
            urlPrefix: resLocals.urlPrefix,
          })}

          <div class="card mb-4">
            <div class="card-header bg-primary text-white d-flex align-items-center">
              <h1>${resLocals.assessment_set.name} ${resLocals.assessment.number}: Questions</h1>
              ${resLocals.authz_data.has_course_instance_permission_edit &&
              assessmentQuestionEditorEnabled
                ? html`
                    <div class="ml-auto">
                      <button class="btn btn-sm btn-light js-enable-edit-button">
                        <i class="fa fa-edit" aria-hidden="true"></i> Edit assessment questions
                      </button>
                      <span class="js-edit-mode-buttons" style="display: none">
                        <button class="btn btn-sm btn-light js-save-and-sync-button" type="button">
                          <i class="fa fa-save" aria-hidden="true"></i> Save and sync
                        </button>
                        <button class="btn btn-sm btn-light" onclick="window.location.reload()">
                          Cancel
                        </button>
                      </span>
                    </div>
                  `
                : ''}
            </div>
            ${AssessmentQuestionsTable({
              questions,
              assessmentType: resLocals.assessment.type,
              urlPrefix: resLocals.urlPrefix,
              csrfToken: resLocals.__csrf_token,
              assessmentInstanceId: resLocals.assessment.id,
              hasCoursePermissionPreview: resLocals.authz_data.has_course_permission_preview,
              hasCourseInstancePermissionEdit:
                resLocals.authz_data.has_course_instance_permission_edit,
            })}
            <div class="card-footer">
              For more information on question settings, see the
              <a href="https://prairielearn.readthedocs.io/en/latest/assessment/" target="_blank"
                >documentation</a
              >.
            </div>
          </div>
        </main>
      </body>
    </html>
  `.toString();
}

function AssessmentQuestionsTable({
  questions,
  urlPrefix,
  assessmentType,
  csrfToken,
  assessmentInstanceId,
  hasCoursePermissionPreview,
  hasCourseInstancePermissionEdit,
}: {
  questions: AssessmentQuestionRow[];
  assessmentType: string;
  urlPrefix: string;
  csrfToken: string;
  assessmentInstanceId: string;
  hasCoursePermissionPreview: boolean;
  hasCourseInstancePermissionEdit: boolean;
}) {
  // If at least one question has a nonzero unlock score, display the Advance Score column
  const showAdvanceScorePercCol =
    questions.filter((q) => q.assessment_question_advance_score_perc !== 0).length >= 1;

  const nTableCols = showAdvanceScorePercCol ? 12 : 11;

  function maxPoints({ max_auto_points, max_manual_points, points_list, init_points }) {
    if (max_auto_points || !max_manual_points) {
      if (assessmentType === 'Exam') {
        return (points_list || [max_manual_points]).map((p) => p - max_manual_points).join(',');
      }
      if (assessmentType === 'Homework') {
        return `${init_points - max_manual_points}/${max_auto_points}`;
      }
    } else {
      return html`&mdash;`;
    }
  }
  return html`
    <div
      class="table-responsive js-assessment-questions-table"
      data-assessment-type="${assessmentType}"
      data-url-prefix="${urlPrefix}"
      data-csrfToken="${csrfToken}"
      data-assessment-instance-id="${assessmentInstanceId}"
    >
      <table class="table table-sm table-hover" aria-label="Assessment questions">
        <thead>
          <tr>
            <th><span class="sr-only">Name</span></th>
            <th>QID</th>
            <th>Topic</th>
            <th>Tags</th>
            <th>Auto Points</th>
            <th>Manual Points</th>
            ${showAdvanceScorePercCol ? html`<th>Advance Score</th>` : ''}
            <th width="100">Mean score</th>
            <th>Num. Submissions Histogram</th>
            <th>Other Assessments</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${questions.map((question) => {
            return html`
              ${question.start_new_zone
                ? html`
                    <tr>
                      <th colspan="${nTableCols}">
                        Zone ${question.zone_number}. ${question.zone_title}
                        ${question.zone_number_choose == null
                          ? '(Choose all questions)'
                          : question.zone_number_choose === 1
                            ? '(Choose 1 question)'
                            : `(Choose ${question.zone_number_choose} questions)`}
                        ${question.zone_has_max_points
                          ? `(maximum ${question.zone_max_points} points)`
                          : ''}
                        ${question.zone_has_best_questions
                          ? `(best ${question.zone_best_questions} questions)`
                          : ''}
                      </th>
                    </tr>
                  `
                : ''}
              ${question.start_new_alternative_group && question.alternative_group_size > 1
                ? html`
                    <tr>
                      <td colspan="${nTableCols}">
                        ${question.alternative_group_number}.
                        ${question.alternative_group_number_choose == null
                          ? 'Choose all questions from:'
                          : question.alternative_group_number_choose === 1
                            ? 'Choose 1 question from:'
                            : `Choose ${question.alternative_group_number_choose} questions from:`}
                      </td>
                    </tr>
                  `
                : ''}
              <tr>
                <td>
                  ${run(() => {
                    const number =
                      question.alternative_group_size === 1
                        ? `${question.alternative_group_number}.`
                        : html`
                            <span class="ml-3">
                              ${question.alternative_group_number}.${question.number_in_alternative_group}.
                            </span>
                          `;
                    const issueBadge = IssueBadge({
                      urlPrefix,
                      count: question.open_issue_count ?? 0,
                      issueQid: question.qid,
                    });
                    const title = html`${number} ${question.title} ${issueBadge}`;

                    if (hasCoursePermissionPreview) {
                      return html`<a href="${urlPrefix}/question/${question.question_id}/"
                        >${title}</a
                      >`;
                    }

                    return title;
                  })}
                </td>
                <td>
                  ${question.sync_errors
                    ? html`
                        <button
                          class="btn btn-xs mr-1 js-sync-popover"
                          data-toggle="popover"
                          data-trigger="hover"
                          data-container="body"
                          data-html="true"
                          data-title="Sync Errors"
                          data-content='<pre style="background-color: black" class="text-white rounded p-3 mb-0">${question.sync_errors_ansified}</pre>'
                          data-custom-class="popover-wide"
                        >
                          <i class="fa fa-times text-danger" aria-hidden="true"></i>
                        </button>
                      `
                    : question.sync_warnings
                      ? html`
                          <button
                            class="btn btn-xs mr-1 js-sync-popover"
                            data-toggle="popover"
                            data-trigger="hover"
                            data-container="body"
                            data-html="true"
                            data-title="Sync Warnings"
                            data-content='<pre style="background-color: black" class="text-white rounded p-3 mb-0">${question.sync_warnings_ansified}</pre>'
                            data-custom-class="popover-wide"
                          >
                            <i
                              class="fa fa-exclamation-triangle text-warning"
                              aria-hidden="true"
                            ></i>
                          </button>
                        `
                      : ''}
                  ${question.display_name}
                </td>
                <td>${question.topic === null ? '' : TopicBadge(question.topic)}</td>
                <td>${TagBadgeList(question.tags)}</td>
                <td>
                  ${maxPoints({
                    max_auto_points: question.max_auto_points,
                    max_manual_points: question.max_manual_points,
                    points_list: question.points_list,
                    init_points: question.init_points,
                  })}
                </td>
                <td>${question.max_manual_points || '—'}</td>
                ${showAdvanceScorePercCol
                  ? html`
                      <td
                        class="${question.assessment_question_advance_score_perc === 0
                          ? 'text-muted'
                          : ''}"
                        data-testid="advance-score-perc"
                      >
                        ${question.assessment_question_advance_score_perc}%
                      </td>
                    `
                  : ''}
                <td>
                  ${question.mean_question_score
                    ? `${question.mean_question_score.toFixed(3)} %`
                    : ''}
                </td>
                <td class="text-center">
                  ${question.number_submissions_hist
                    ? html`
                        <div
                          class="js-histmini"
                          data-data="${JSON.stringify(question.number_submissions_hist)}"
                          data-options="${JSON.stringify({ width: 60, height: 20 })}"
                        ></div>
                      `
                    : ''}
                </td>
                <td>
                  ${question.other_assessments?.map((assessment) =>
                    AssessmentBadge({ urlPrefix, assessment }),
                  )}
                </td>
                <td class="text-right">
                  <div class="dropdown js-question-actions">
                    <button
                      type="button"
                      class="btn btn-secondary btn-xs dropdown-toggle"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      Action <span class="caret"></span>
                    </button>

                    <div class="dropdown-menu">
                      ${hasCourseInstancePermissionEdit
                        ? html`
                            <button
                              class="dropdown-item"
                              data-toggle="modal"
                              data-target="#resetQuestionVariantsModal"
                              data-assessment-question-id="${question.id}"
                            >
                              Reset question variants
                            </button>
                          `
                        : html`
                            <button class="dropdown-item disabled" disabled>
                              Must have editor permission
                            </button>
                          `}
                    </div>
                  </div>
                </td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
}
