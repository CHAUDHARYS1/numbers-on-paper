/* @ds-bundle: {"format":3,"namespace":"TaskmasterProDesignSystem_b94546","components":[{"name":"Column","sourcePath":"components/board/Column.jsx"},{"name":"TaskCard","sourcePath":"components/board/TaskCard.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"LabelChip","sourcePath":"components/core/LabelChip.jsx"},{"name":"Modal","sourcePath":"components/core/Modal.jsx"},{"name":"PRIORITIES","sourcePath":"components/core/PriorityTag.jsx"},{"name":"PriorityTag","sourcePath":"components/core/PriorityTag.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"SegmentedControl","sourcePath":"components/core/SegmentedControl.jsx"}],"sourceHashes":{"components/board/Column.jsx":"c0a00ab49365","components/board/TaskCard.jsx":"939b12e1d30b","components/core/Avatar.jsx":"eba169a30ea5","components/core/Badge.jsx":"d01bbe148b23","components/core/Button.jsx":"32649370cdda","components/core/Checkbox.jsx":"f751e10d1a65","components/core/Field.jsx":"dcf2d4b34f3d","components/core/LabelChip.jsx":"3e921ebe5ce9","components/core/Modal.jsx":"363ee97cb859","components/core/PriorityTag.jsx":"6a1a4cb3097f","components/core/ProgressBar.jsx":"8026c2d10098","components/core/SegmentedControl.jsx":"8778c03b5a27","ui_kits/app/data.js":"d2daa6d13497","ui_kits/app/screens.jsx":"508f2ad81ba5"},"inlinedExternals":[],"unexposedExports":[{"name":"userColor","sourcePath":"components/core/Avatar.jsx"}]} */

(() => {

const __ds_ns = (window.TaskmasterProDesignSystem_b94546 = window.TaskmasterProDesignSystem_b94546 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/board/Column.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Column — a Kanban status column. A colored top rule names the status;
 * the header carries a label + count badge; children are TaskCards.
 */
function Column({
  label,
  color = 'var(--line)',
  count,
  children,
  className = '',
  ...rest
}) {
  const n = count != null ? count : React.Children.count(children);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['tm-column', className].filter(Boolean).join(' '),
    style: {
      '--col-color': color
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "tm-column-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tm-column-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "tm-column-count"
  }, n)), /*#__PURE__*/React.createElement("ul", {
    className: "tm-column-list"
  }, children));
}
Object.assign(__ds_scope, { Column });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/board/Column.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const USER_COLORS = ['#2563EB', '#15803d', '#7c3aed', '#c2410c', '#be185d', '#0f766e'];

/** Deterministic per-user color — mirrors src/lib/userColor.js. */
function userColor(userId) {
  let hash = 0;
  for (const ch of String(userId)) hash = hash * 31 + ch.charCodeAt(0) | 0;
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

/**
 * Avatar — a user or workspace initial bubble. Circle for people,
 * square (rounded) for workspaces. Color is usually derived from
 * the user id via userColor() so a person reads the same everywhere.
 */
function Avatar({
  name = '',
  src,
  userId,
  color,
  size = 'md',
  shape = 'circle',
  className = '',
  ...rest
}) {
  const cls = ['tm-avatar', `tm-avatar--${size}`, shape === 'square' ? 'tm-avatar--square' : '', className].filter(Boolean).join(' ');
  const bg = color || (userId != null ? userColor(userId) : '#888');
  const initial = name ? name.trim()[0].toUpperCase() : '?';
  if (src) {
    return /*#__PURE__*/React.createElement("img", _extends({
      className: cls,
      src: src,
      alt: name,
      style: {
        background: bg
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      background: bg
    },
    "aria-hidden": "true"
  }, rest), initial);
}
Object.assign(__ds_scope, { userColor, Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — a compact, uppercase, mono status pill. Read-only status
 * only (never an action). Tones map to the semantic color tints.
 */
function Badge({
  children,
  tone = 'gray',
  className = '',
  ...rest
}) {
  const cls = ['tm-pill', `tm-pill--${tone}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — Taskmaster Pro's primary action control.
 * Variants: primary (accent fill), ghost (quiet), danger (outlined red).
 * Always ≥44px tall at md size; presses scale to 0.97 with a spring.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  const cls = ['tm-btn', `tm-btn--${variant}`, `tm-btn--${size}`, block ? 'tm-btn--block' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled,
    onClick: onClick
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — a square accent checkbox, optionally with a label.
 * Used in checklists, filters, and bulk-select.
 */
function Checkbox({
  label,
  checked,
  onChange,
  id,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const box = /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: "checkbox",
    className: "tm-checkbox",
    checked: checked,
    onChange: onChange
  }, rest));
  if (!label) return box;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      cursor: 'pointer',
      fontSize: 'var(--text-md)',
      color: 'var(--ink-2)'
    },
    className: className
  }, box, label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Field — a labeled text input with optional hint / error. The label
 * is an uppercase eyebrow; focus draws the accent ring.
 */
function Field({
  label,
  hint,
  error,
  id,
  type = 'text',
  textarea = false,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const cls = ['tm-field', error ? 'tm-field--error' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "tm-field-label",
    htmlFor: inputId
  }, label), textarea ? /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    className: "tm-field-input",
    rows: rest.rows || 3
  }, rest)) : /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    className: "tm-field-input"
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "tm-field-hint tm-field-hint--error"
  }, error) : hint && /*#__PURE__*/React.createElement("span", {
    className: "tm-field-hint"
  }, hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/LabelChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Convert a #rrggbb to an "r,g,b" string. */
function rgb(hex) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

/**
 * LabelChip — a workspace-scoped colored tag (Bug, Feature, Design…).
 * The chip text takes the label color over a 12% tint of the same hue.
 */
function LabelChip({
  children,
  color = '#2563EB',
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['tm-label-chip', className].filter(Boolean).join(' '),
    style: {
      '--label-color': color,
      '--label-bg': `rgba(${rgb(color)},0.12)`
    }
  }, rest), children);
}
Object.assign(__ds_scope, { LabelChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/LabelChip.jsx", error: String((e && e.message) || e) }); }

// components/core/Modal.jsx
try { (() => {
/**
 * Modal — a centered dialog with a surface header, body, and footer.
 * Renders an overlay scrim; click the scrim or the × to close.
 */
function Modal({
  title,
  open = true,
  onClose,
  children,
  footer,
  className = ''
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "tm-modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: ['tm-modal', className].filter(Boolean).join(' '),
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "tm-modal-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tm-modal-title"
  }, title), /*#__PURE__*/React.createElement("button", {
    className: "tm-modal-close",
    "aria-label": "Close",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "tm-modal-body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "tm-modal-footer"
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Modal.jsx", error: String((e && e.message) || e) }); }

// components/core/PriorityTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PRIORITIES = {
  low: {
    name: 'Low',
    color: '#15803d',
    icon: '↓'
  },
  medium: {
    name: 'Medium',
    color: '#d97706',
    icon: '→'
  },
  high: {
    name: 'High',
    color: '#c2410c',
    icon: '↑'
  },
  urgent: {
    name: 'Urgent',
    color: '#b91c1c',
    icon: '!!'
  }
};

/**
 * PriorityTag — a task's priority indicator (Low → Urgent). Icon +
 * label, tinted by the priority color.
 */
function PriorityTag({
  level = 'medium',
  showLabel = true,
  className = '',
  ...rest
}) {
  const def = PRIORITIES[level] || PRIORITIES.medium;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['tm-priority-chip', className].filter(Boolean).join(' '),
    style: {
      '--p-color': def.color
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "tm-priority-icon",
    "aria-hidden": "true"
  }, def.icon), showLabel && def.name);
}
Object.assign(__ds_scope, { PRIORITIES, PriorityTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PriorityTag.jsx", error: String((e && e.message) || e) }); }

// components/board/TaskCard.jsx
try { (() => {
/**
 * TaskCard — the signature Taskmaster Pro object. A draggable card with
 * a colored left rule that encodes state: green = done, red = overdue,
 * amber = due soon. Composes PriorityTag, LabelChip, and Avatar.
 *
 * Pass a `task` object; everything else is optional metadata.
 */
function TaskCard({
  task = {},
  onClick,
  className = ''
}) {
  const {
    text,
    description,
    status,
    due,
    dueState,
    // 'overdue' | 'due-soon' | null
    priority,
    // 'low' | 'medium' | 'high' | 'urgent'
    assignee,
    // { name, id } | { name, color }
    labels = [],
    // [{ name, color }]
    checklist,
    // { done, total }
    comments // number
  } = task;
  const done = status === 'done';
  const cls = ['tm-task-card', done ? 'tm-task-card--done' : '', !done && dueState === 'overdue' ? 'tm-task-card--overdue' : '', !done && dueState === 'due-soon' ? 'tm-task-card--due-soon' : '', className].filter(Boolean).join(' ');
  const hasFooter = due || assignee || comments > 0 || checklist && checklist.total > 0;
  return /*#__PURE__*/React.createElement("li", {
    className: cls,
    onClick: onClick
  }, priority && /*#__PURE__*/React.createElement(__ds_scope.PriorityTag, {
    level: priority
  }), /*#__PURE__*/React.createElement("p", {
    className: "tm-task-title"
  }, text), description && /*#__PURE__*/React.createElement("p", {
    className: "tm-task-desc"
  }, description), labels.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "tm-task-labels"
  }, labels.map(l => /*#__PURE__*/React.createElement(__ds_scope.LabelChip, {
    key: l.name,
    color: l.color
  }, l.name))), hasFooter && /*#__PURE__*/React.createElement("div", {
    className: "tm-task-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tm-task-footer-left"
  }, assignee && /*#__PURE__*/React.createElement("span", {
    className: "tm-task-assignee"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tm-task-assignee-dot",
    style: {
      background: assignee.color || __ds_scope.userColor(assignee.id ?? assignee.name)
    }
  }), assignee.name)), /*#__PURE__*/React.createElement("div", {
    className: "tm-task-footer-right"
  }, checklist && checklist.total > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tm-task-meta-chip",
    title: `${checklist.done} of ${checklist.total} done`
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2611"), checklist.done, "/", checklist.total), comments > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tm-task-meta-chip",
    title: `${comments} comments`
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83D\uDCAC"), comments), due && /*#__PURE__*/React.createElement("span", {
    className: "tm-task-due"
  }, due))));
}
Object.assign(__ds_scope, { TaskCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/board/TaskCard.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressBar — a thin completion track (checklist progress, etc).
 * Clamps 0–100; fill color defaults to accent.
 */
function ProgressBar({
  value = 0,
  color,
  className = '',
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['tm-progress-track', className].filter(Boolean).join(' '),
    role: "progressbar",
    "aria-valuenow": pct,
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "tm-progress-fill",
    style: {
      width: `${pct}%`,
      ...(color ? {
        '--progress-color': color
      } : {})
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SegmentedControl — a 2–4 option toggle (board/list view, month/week,
 * etc.). The active option gets a raised white pill.
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['tm-segmented', className].filter(Boolean).join(' '),
    role: "tablist"
  }, rest), options.map(opt => {
    const val = typeof opt === 'string' ? opt : opt.value;
    const label = typeof opt === 'string' ? opt : opt.label;
    const icon = typeof opt === 'string' ? null : opt.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      role: "tab",
      "aria-selected": value === val,
      className: value === val ? 'tm-seg--on' : '',
      onClick: () => onChange?.(val)
    }, icon, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
/* Seed data for the Taskmaster Pro app UI kit — fake workspace + board. */
window.TM_DATA = {
  user: {
    name: 'Maya Chen',
    email: 'maya@taskmaster.app',
    id: 'u_maya'
  },
  workspaces: [{
    id: 'ws_personal',
    name: 'My Workspace',
    color: '#2563EB',
    personal: true
  }, {
    id: 'ws_design',
    name: 'Design Team',
    color: '#7c3aed',
    emoji: 'D'
  }, {
    id: 'ws_search',
    name: 'Job Search',
    color: '#0f766e',
    emoji: 'J'
  }],
  members: [{
    name: 'Maya Chen',
    id: 'u_maya',
    online: true
  }, {
    name: 'Jon Okafor',
    id: 'u_jon',
    online: true
  }, {
    name: 'Sara Park',
    id: 'u_sara',
    online: false
  }, {
    name: 'Dev Kapoor',
    id: 'u_dev',
    online: true
  }],
  columns: [{
    id: 'todo',
    label: 'To Do',
    color: '#6366f1'
  }, {
    id: 'doing',
    label: 'In Progress',
    color: '#0ea5e9'
  }, {
    id: 'review',
    label: 'In Review',
    color: '#d97706'
  }, {
    id: 'done',
    label: 'Done',
    color: '#22c55e'
  }],
  tasks: [{
    id: 't1',
    col: 'todo',
    text: 'Q3 design audit',
    description: 'Review every screen against the new token system and log inconsistencies.',
    priority: 'medium',
    labels: [{
      name: 'Design',
      color: '#7c3aed'
    }],
    assignee: {
      name: 'Maya Chen',
      id: 'u_maya'
    },
    due: 'Aug 28',
    checklist: {
      done: 1,
      total: 4
    },
    comments: 0
  }, {
    id: 't2',
    col: 'todo',
    text: 'Migrate auth to Supabase v2',
    description: 'Upgrade the client and move session handling to the new API.',
    priority: 'high',
    labels: [{
      name: 'Dev',
      color: '#2563EB'
    }],
    assignee: {
      name: 'Dev Kapoor',
      id: 'u_dev'
    },
    due: 'Tomorrow',
    dueState: 'due-soon',
    comments: 2
  }, {
    id: 't3',
    col: 'todo',
    text: 'Update component library',
    priority: 'low',
    labels: [{
      name: 'Dev',
      color: '#2563EB'
    }],
    comments: 0
  }, {
    id: 't4',
    col: 'doing',
    text: 'Dashboard redesign',
    description: 'Rework the analytics layout so the activity heatmap stacks cleanly on mobile.',
    priority: 'urgent',
    dueState: 'overdue',
    due: '2d ago',
    labels: [{
      name: 'Design',
      color: '#7c3aed'
    }],
    assignee: {
      name: 'Sara Park',
      id: 'u_sara'
    },
    checklist: {
      done: 2,
      total: 5
    },
    comments: 3
  }, {
    id: 't5',
    col: 'doing',
    text: 'API rate limiting',
    description: 'Add per-workspace throttling to the realtime endpoints.',
    priority: 'high',
    labels: [{
      name: 'Dev',
      color: '#2563EB'
    }],
    assignee: {
      name: 'Jon Okafor',
      id: 'u_jon'
    },
    comments: 4
  }, {
    id: 't6',
    col: 'review',
    text: 'Onboarding flow copy',
    description: 'Tighten the empty-state and first-run microcopy.',
    priority: 'medium',
    labels: [{
      name: 'Design',
      color: '#7c3aed'
    }],
    assignee: {
      name: 'Maya Chen',
      id: 'u_maya'
    },
    due: 'Sep 2',
    checklist: {
      done: 3,
      total: 3
    }
  }, {
    id: 't7',
    col: 'done',
    text: 'Dark mode tokens',
    status: 'done',
    labels: [{
      name: 'Feature',
      color: '#2563EB'
    }],
    checklist: {
      done: 8,
      total: 8
    }
  }, {
    id: 't8',
    col: 'done',
    text: 'Mobile sidebar drawer',
    status: 'done',
    assignee: {
      name: 'Dev Kapoor',
      id: 'u_dev'
    }
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/app/screens.jsx
try { (() => {
/* ── Taskmaster Pro app UI kit — interactive screens ───────
   Composes design-system primitives from the bundle namespace.
   ───────────────────────────────────────────────────────── */
const DS = window.TaskmasterProDesignSystem_b94546;
const {
  Column,
  TaskCard,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Field,
  LabelChip,
  PriorityTag,
  ProgressBar,
  SegmentedControl
} = DS;
const LOGO = '../../assets/brand-assets/logo-lockup.svg';

/* ─── Auth screen ─── */
function AuthScreen({
  onSignIn
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-left-inner"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "Taskmaster Pro",
    style: {
      height: 30,
      filter: 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-left-body"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "auth-left-headline"
  }, "One board.", /*#__PURE__*/React.createElement("br", null), "Every workflow."), /*#__PURE__*/React.createElement("ul", {
    className: "auth-features"
  }, ['Real-time collaborative board', 'Job, freelance & blank templates', 'Assignees, labels, priorities & due dates', 'Board, List, Calendar & Dashboard views'].map(f => /*#__PURE__*/React.createElement("li", {
    className: "auth-feature-item",
    key: f
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-check-circle auth-feature-icon",
    style: {
      fontSize: 18
    }
  }), f)))), /*#__PURE__*/React.createElement("span", {
    className: "auth-left-tagline"
  }, "Designed and built by SC Design and Consultation"))), /*#__PURE__*/React.createElement("div", {
    className: "auth-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-card-header"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "auth-card-title"
  }, "Welcome back"), /*#__PURE__*/React.createElement("p", {
    className: "auth-subtitle"
  }, "Sign in to your workspace to continue.")), /*#__PURE__*/React.createElement("form", {
    className: "auth-form",
    onSubmit: e => {
      e.preventDefault();
      onSignIn();
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    type: "email",
    defaultValue: "maya@taskmaster.app"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    type: "password",
    defaultValue: "taskmaster"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    block: true
  }, "Sign in")), /*#__PURE__*/React.createElement("p", {
    className: "auth-switch"
  }, "No account yet? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onSignIn();
    }
  }, "Create one free")))));
}

/* ─── Sidebar ─── */
function Sidebar({
  data
}) {
  const nav = [{
    icon: 'ph-squares-four',
    label: 'Board',
    active: true
  }, {
    icon: 'ph-chart-bar',
    label: 'Dashboard'
  }, {
    icon: 'ph-calendar-blank',
    label: 'Calendar'
  }, {
    icon: 'ph-note-pencil',
    label: 'Writes'
  }, {
    icon: 'ph-archive',
    label: 'Archive'
  }];
  return /*#__PURE__*/React.createElement("aside", {
    className: "k-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-side-logo"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "Taskmaster Pro"
  }), /*#__PURE__*/React.createElement("button", {
    className: "k-bell",
    "aria-label": "Notifications"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-bell"
  }))), /*#__PURE__*/React.createElement("nav", {
    className: "k-nav"
  }, nav.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.label,
    className: 'k-nav-btn' + (n.active ? ' k-nav-btn--active' : '')
  }, /*#__PURE__*/React.createElement("i", {
    className: 'ph ' + n.icon
  }), n.label))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "k-side-label"
  }, "Workspaces"), /*#__PURE__*/React.createElement("div", {
    className: "k-ws-list"
  }, data.workspaces.map((w, i) => /*#__PURE__*/React.createElement("button", {
    key: w.id,
    className: 'k-ws-item' + (i === 0 ? ' k-ws-item--active' : '')
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: w.name,
    shape: "square",
    color: w.color,
    size: "md"
  }), /*#__PURE__*/React.createElement("span", {
    className: "k-ws-name"
  }, w.name))))), /*#__PURE__*/React.createElement("button", {
    className: "k-signout",
    style: {
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-plus"
  }), "New workspace"), /*#__PURE__*/React.createElement("div", {
    className: "k-side-spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "k-side-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-profile"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: data.user.name,
    userId: data.user.id,
    size: "md"
  }), /*#__PURE__*/React.createElement("span", {
    className: "k-profile-name"
  }, data.user.name)), /*#__PURE__*/React.createElement("button", {
    className: "k-signout"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-sign-out"
  }), "Sign out")));
}

/* ─── Board header ─── */
function BoardHeader({
  data,
  view,
  onView
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "k-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-header-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-header-title"
  }, "My Workspace")), /*#__PURE__*/React.createElement("div", {
    className: "k-header-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-avatars"
  }, data.members.map(m => /*#__PURE__*/React.createElement("span", {
    key: m.id,
    className: m.online ? 'k-online-dot' : ''
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.name,
    userId: m.id,
    size: "md"
  })))), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: 'board',
      label: 'Board',
      icon: /*#__PURE__*/React.createElement("i", {
        className: "ph ph-squares-four",
        style: {
          fontSize: 14
        }
      })
    }, {
      value: 'list',
      label: 'List',
      icon: /*#__PURE__*/React.createElement("i", {
        className: "ph ph-list",
        style: {
          fontSize: 14
        }
      })
    }],
    value: view,
    onChange: onView
  }), /*#__PURE__*/React.createElement("button", {
    className: "k-icon-btn",
    "aria-label": "Search"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-magnifying-glass"
  })), /*#__PURE__*/React.createElement("button", {
    className: "k-icon-btn",
    "aria-label": "Filter"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-funnel"
  })), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-plus",
    style: {
      fontSize: 15
    }
  }), "Add task")));
}

/* ─── Board ─── */
function BoardView({
  data,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "k-columns-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-columns"
  }, data.columns.map(col => {
    const tasks = data.tasks.filter(t => t.col === col.id);
    return /*#__PURE__*/React.createElement(Column, {
      key: col.id,
      label: col.label,
      color: col.color,
      count: tasks.length
    }, tasks.map(t => /*#__PURE__*/React.createElement(TaskCard, {
      key: t.id,
      task: t,
      onClick: () => onOpen(t)
    })), col.id === 'todo' && /*#__PURE__*/React.createElement("div", {
      className: "k-quickadd"
    }, /*#__PURE__*/React.createElement("input", {
      placeholder: "Add a task\u2026"
    }), /*#__PURE__*/React.createElement("button", {
      disabled: true,
      "aria-label": "Add"
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph ph-plus"
    }))));
  })));
}

/* ─── Task detail panel ─── */
function TaskPanel({
  task,
  onClose
}) {
  const statusMap = {
    todo: 'To Do',
    doing: 'In Progress',
    review: 'In Review',
    done: 'Done'
  };
  const comments = [{
    name: 'Jon Okafor',
    id: 'u_jon',
    time: '2h ago',
    text: 'Pushed the first pass — mobile breakpoint still needs work.'
  }, {
    name: 'Sara Park',
    id: 'u_sara',
    time: '40m ago',
    text: 'Looks great. Can we tighten the heatmap spacing?'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "k-panel-scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "k-panel",
    role: "dialog",
    "aria-label": task.text
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-panel-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-panel-status"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: task.status === 'done' ? 'green' : 'gray'
  }, statusMap[task.col]), task.priority && /*#__PURE__*/React.createElement(PriorityTag, {
    level: task.priority
  })), /*#__PURE__*/React.createElement("button", {
    className: "k-icon-btn",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-x"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "k-panel-body"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "k-panel-title"
  }, task.text)), task.description && /*#__PURE__*/React.createElement("p", {
    className: "k-panel-desc"
  }, task.description), /*#__PURE__*/React.createElement("div", {
    className: "k-meta-grid"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-meta-label"
  }, "Assignee"), /*#__PURE__*/React.createElement("span", {
    className: "k-meta-val"
  }, task.assignee ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Avatar, {
    name: task.assignee.name,
    userId: task.assignee.id,
    size: "sm"
  }), task.assignee.name) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "Unassigned")), /*#__PURE__*/React.createElement("span", {
    className: "k-meta-label"
  }, "Due"), /*#__PURE__*/React.createElement("span", {
    className: "k-meta-val",
    style: {
      color: task.dueState === 'overdue' ? 'var(--red)' : task.dueState === 'due-soon' ? 'var(--amber)' : 'var(--ink-2)'
    }
  }, task.due || '—'), /*#__PURE__*/React.createElement("span", {
    className: "k-meta-label"
  }, "Labels"), /*#__PURE__*/React.createElement("span", {
    className: "k-meta-val"
  }, task.labels ? task.labels.map(l => /*#__PURE__*/React.createElement(LabelChip, {
    key: l.name,
    color: l.color
  }, l.name)) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "None"))), task.checklist && task.checklist.total > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "k-section-h"
  }, "Checklist \xB7 ", task.checklist.done, "/", task.checklist.total), /*#__PURE__*/React.createElement(ProgressBar, {
    value: Math.round(task.checklist.done / task.checklist.total * 100),
    color: task.checklist.done === task.checklist.total ? 'var(--green)' : 'var(--accent)'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, ['Audit color usage', 'Audit spacing tokens', 'Audit type ramp', 'Log inconsistencies', 'Share findings'].slice(0, task.checklist.total).map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c,
    className: 'k-check-row' + (i < task.checklist.done ? ' k-check-row--done' : '')
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: i < task.checklist.done,
    readOnly: true
  }), c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "k-section-h"
  }, "Comments \xB7 ", comments.length), comments.map(c => /*#__PURE__*/React.createElement("div", {
    className: "k-comment",
    key: c.name
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: c.name,
    userId: c.id,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    className: "k-comment-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k-comment-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-comment-name"
  }, c.name), /*#__PURE__*/React.createElement("span", {
    className: "k-comment-time"
  }, c.time)), /*#__PURE__*/React.createElement("div", {
    className: "k-comment-text"
  }, c.text)))), /*#__PURE__*/React.createElement("div", {
    className: "k-comment-box"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Write a comment\u2026"
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Send"))))));
}

/* ─── App root ─── */
function App() {
  const data = window.TM_DATA;
  const [screen, setScreen] = React.useState(window.TM_START || 'auth');
  const [view, setView] = React.useState('board');
  const [openTask, setOpenTask] = React.useState(null);
  if (screen === 'auth') return /*#__PURE__*/React.createElement(AuthScreen, {
    onSignIn: () => setScreen('board')
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "app-shell"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    data: data
  }), /*#__PURE__*/React.createElement("main", {
    className: "k-main"
  }, /*#__PURE__*/React.createElement(BoardHeader, {
    data: data,
    view: view,
    onView: setView
  }), /*#__PURE__*/React.createElement(BoardView, {
    data: data,
    onOpen: setOpenTask
  })), openTask && /*#__PURE__*/React.createElement(TaskPanel, {
    task: openTask,
    onClose: () => setOpenTask(null)
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Column = __ds_scope.Column;

__ds_ns.TaskCard = __ds_scope.TaskCard;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.LabelChip = __ds_scope.LabelChip;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.PRIORITIES = __ds_scope.PRIORITIES;

__ds_ns.PriorityTag = __ds_scope.PriorityTag;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

})();
