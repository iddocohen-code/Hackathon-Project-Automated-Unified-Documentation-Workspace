/* @ds-bundle: {"format":3,"namespace":"UpwindDesignSystem_019df7","components":[{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"SeverityBadge","sourcePath":"components/feedback/SeverityBadge.jsx"},{"name":"StatusDot","sourcePath":"components/feedback/StatusDot.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"},{"name":"MetricCard","sourcePath":"components/layout/MetricCard.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/data/Avatar.jsx":"ddcd08860c98","components/feedback/Badge.jsx":"104a4edcddde","components/feedback/SeverityBadge.jsx":"41d2560ce8ae","components/feedback/StatusDot.jsx":"3a117c3ed213","components/forms/Button.jsx":"ede3e0da1181","components/forms/IconButton.jsx":"34565ec636ed","components/forms/Input.jsx":"88b250fdee5a","components/forms/Switch.jsx":"b9970e5b6553","components/layout/Card.jsx":"27e4b7fe8776","components/layout/MetricCard.jsx":"c0eaf8b3934a","components/navigation/Tabs.jsx":"88d08c3455b1","slides/deck-stage.js":"522102a1c71e","ui_kits/console/Dashboard.jsx":"c4ff045f1579","ui_kits/console/Findings.jsx":"22edbb149162","ui_kits/console/Inventory.jsx":"b28233d909c5","ui_kits/console/Shell.jsx":"31fd811c0ce2","ui_kits/console/Threats.jsx":"95e034e7e074","ui_kits/console/data.jsx":"f0a5aa731020","ui_kits/console/icons.jsx":"32010cc4409e","ui_kits/website/sections.jsx":"fe86623c1e19","uploads/deck-stage.js":"522102a1c71e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.UpwindDesignSystem_019df7 = window.UpwindDesignSystem_019df7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
const PALETTE = ["var(--uw-blue-02)", "var(--uw-royal-purple-02)", "var(--uw-cyan-01)", "var(--uw-green-02)", "var(--uw-amber-02)", "var(--uw-magenta-02)"];
function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
function hashIndex(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) >>> 0;
  return h % PALETTE.length;
}

/**
 * Upwind Avatar — circular user/identity token. Image, or auto-colored initials.
 */
function Avatar({
  name = "",
  src,
  size = 32,
  style = {}
}) {
  const dim = size;
  const base = {
    width: dim,
    height: dim,
    borderRadius: "50%",
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontFamily: "var(--font-default-family)",
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", {
      src: src,
      alt: name,
      style: {
        ...base,
        objectFit: "cover"
      }
    });
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      background: PALETTE[hashIndex(name)],
      color: "#fff",
      fontSize: Math.round(dim * 0.4),
      fontWeight: 500
    }
  }, initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
/**
 * Upwind Badge — generic status / category label. For risk severity use SeverityBadge.
 * color: neutral | blue | green | amber | red | purple | cyan
 */
function Badge({
  children,
  color = "neutral",
  variant = "soft",
  style = {}
}) {
  const map = {
    neutral: {
      fg: "var(--text-secondary)",
      bg: "var(--bg-tertiary)",
      solidBg: "var(--uw-gray-02)"
    },
    blue: {
      fg: "var(--uw-blue-01)",
      bg: "var(--uw-blue-06)",
      solidBg: "var(--uw-blue-02)"
    },
    green: {
      fg: "var(--uw-green-01)",
      bg: "var(--uw-green-06)",
      solidBg: "var(--uw-green-02)"
    },
    amber: {
      fg: "var(--uw-amber-01)",
      bg: "var(--uw-amber-06)",
      solidBg: "var(--uw-amber-02)"
    },
    red: {
      fg: "var(--uw-red-01)",
      bg: "var(--uw-red-06)",
      solidBg: "var(--uw-red-02)"
    },
    purple: {
      fg: "var(--uw-royal-purple-01)",
      bg: "var(--uw-royal-purple-06)",
      solidBg: "var(--uw-royal-purple-02)"
    },
    cyan: {
      fg: "var(--uw-cyan-01)",
      bg: "var(--uw-cyan-06)",
      solidBg: "var(--uw-cyan-02)"
    }
  };
  const c = map[color] || map.neutral;
  const solid = variant === "solid";
  const outline = variant === "outline";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: 20,
      padding: "0 8px",
      borderRadius: "var(--radius-4)",
      fontFamily: "var(--font-default-family)",
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1,
      whiteSpace: "nowrap",
      color: solid ? "#fff" : c.fg,
      background: solid ? c.solidBg : outline ? "transparent" : c.bg,
      border: outline ? `1px solid ${c.fg}` : "1px solid transparent",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SeverityBadge.jsx
try { (() => {
const LEVELS = {
  critical: {
    label: "Critical",
    fg: "var(--severity-critical)",
    bg: "var(--severity-critical-bg)"
  },
  high: {
    label: "High",
    fg: "var(--severity-high)",
    bg: "var(--severity-high-bg)"
  },
  medium: {
    label: "Medium",
    fg: "var(--severity-medium)",
    bg: "var(--severity-medium-bg)"
  },
  low: {
    label: "Low",
    fg: "var(--uw-yellow-01)",
    bg: "var(--severity-low-bg)"
  },
  info: {
    label: "Info",
    fg: "var(--text-secondary)",
    bg: "var(--severity-info-bg)"
  },
  safe: {
    label: "Resolved",
    fg: "var(--severity-safe)",
    bg: "var(--severity-safe-bg)"
  }
};

/**
 * Upwind SeverityBadge — the canonical CNAPP finding severity indicator.
 * variant: "soft" (tinted pill, default) | "solid" (filled) | "dot" (dot + text).
 */
function SeverityBadge({
  level = "info",
  variant = "soft",
  label,
  style = {}
}) {
  const lv = LEVELS[level] || LEVELS.info;
  const text = label || lv.label;
  if (variant === "dot") {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-default-family)",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--text-primary)",
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: lv.fg,
        flex: "none"
      }
    }), text);
  }
  const solid = variant === "solid";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 20,
      padding: "0 8px",
      borderRadius: "var(--radius-4)",
      fontFamily: "var(--font-default-family)",
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1,
      color: solid ? "#fff" : lv.fg,
      background: solid ? lv.fg : lv.bg,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: solid ? "#fff" : lv.fg,
      flex: "none"
    }
  }), text);
}
Object.assign(__ds_scope, { SeverityBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/SeverityBadge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusDot.jsx
try { (() => {
/**
 * Upwind StatusDot — small live-status indicator with optional pulse and label.
 * status: online | offline | warning | pending
 */
function StatusDot({
  status = "online",
  label,
  pulse = false,
  style = {}
}) {
  const map = {
    online: "var(--severity-safe)",
    offline: "var(--text-tertiary)",
    warning: "var(--severity-medium)",
    pending: "var(--uw-blue-02)"
  };
  const c = map[status] || map.online;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-default-family)",
      fontSize: 12,
      color: "var(--text-secondary)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      width: 8,
      height: 8,
      flex: "none"
    }
  }, pulse && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: c,
      opacity: 0.4,
      animation: "uwpulse 1.6s ease-out infinite"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: c
    }
  })), label, /*#__PURE__*/React.createElement("style", null, "@keyframes uwpulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.6);opacity:0}}"));
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Upwind Button — primary action control.
 * Variants: primary (brand blue), secondary (outline), ghost, danger.
 * Sizes: sm (28), md (32), lg (40). Compact, 4px radius, 500 weight.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  iconRight = null,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 28,
      padding: "0 10px",
      fontSize: 13,
      gap: 6
    },
    md: {
      height: 32,
      padding: "0 14px",
      fontSize: 14,
      gap: 8
    },
    lg: {
      height: 40,
      padding: "0 20px",
      fontSize: 14,
      gap: 8
    }
  };
  const variants = {
    primary: {
      background: "var(--action-primary)",
      color: "#fff",
      border: "1px solid var(--action-primary)"
    },
    secondary: {
      background: "var(--surface)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-primary)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-primary)",
      border: "1px solid transparent"
    },
    danger: {
      background: "var(--severity-high)",
      color: "#fff",
      border: "1px solid var(--severity-high)"
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? variant === "primary" ? {
    background: "var(--action-primary-hover)",
    borderColor: "var(--action-primary-hover)"
  } : variant === "danger" ? {
    filter: "brightness(0.93)"
  } : {
    background: "var(--interactive-hover)"
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? "100%" : "auto",
      fontFamily: "var(--font-default-family)",
      fontSize: s.fontSize,
      fontWeight: 500,
      lineHeight: 1,
      borderRadius: "var(--radius-4)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "background 120ms ease, border-color 120ms ease, filter 120ms ease",
      whiteSpace: "nowrap",
      ...v,
      ...hoverStyle,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "none"
    }
  }, icon), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "none"
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Upwind IconButton — square, icon-only control for toolbars and table rows.
 */
function IconButton({
  children,
  size = "md",
  variant = "ghost",
  disabled = false,
  active = false,
  title,
  onClick,
  style = {},
  ...rest
}) {
  const dims = {
    sm: 28,
    md: 32,
    lg: 36
  }[size] || 32;
  const [hover, setHover] = React.useState(false);
  const base = {
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)"
    },
    solid: {
      background: "var(--action-primary)",
      color: "#fff"
    },
    outline: {
      background: "var(--surface)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-primary)"
    }
  }[variant] || {
    background: "transparent",
    color: "var(--text-secondary)"
  };
  const activeBg = active ? {
    background: "var(--interactive-active)",
    color: "var(--text-primary)"
  } : {};
  const hoverBg = !disabled && hover && variant !== "solid" ? {
    background: "var(--interactive-hover)",
    color: "var(--text-primary)"
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    title: title,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dims,
      height: dims,
      borderRadius: "var(--radius-4)",
      border: base.border || "1px solid transparent",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "background 120ms ease, color 120ms ease",
      ...base,
      ...activeBg,
      ...hoverBg,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Upwind Input — text field with optional label, leading icon, and error.
 */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon = null,
  error = null,
  hint = null,
  disabled = false,
  fullWidth = true,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--severity-high)" : focus ? "var(--action-primary)" : "var(--border-primary)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      gap: 6,
      width: fullWidth ? "100%" : "auto",
      fontFamily: "var(--font-default-family)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 32,
      padding: "0 10px",
      background: disabled ? "var(--bg-tertiary)" : "var(--surface)",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius-4)",
      boxShadow: focus ? "0 0 0 3px var(--uw-primary-05)" : "none",
      transition: "border-color 120ms ease, box-shadow 120ms ease"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--text-tertiary)",
      flex: "none"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-default-family)",
      fontSize: 14,
      color: "var(--text-primary)",
      minWidth: 0
    }
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: error ? "var(--severity-high)" : "var(--text-tertiary)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Upwind Switch — boolean toggle.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  size = "md",
  style = {}
}) {
  const dims = size === "sm" ? {
    w: 28,
    h: 16,
    k: 12
  } : {
    w: 36,
    h: 20,
    k: 16
  };
  const toggle = () => !disabled && onChange && onChange(!checked);
  const control = /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": checked,
    onClick: toggle,
    style: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      width: dims.w,
      height: dims.h,
      flex: "none",
      borderRadius: dims.h,
      background: checked ? "var(--action-primary)" : "var(--uw-gray-04)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background 140ms ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: (dims.h - dims.k) / 2,
      left: checked ? dims.w - dims.k - (dims.h - dims.k) / 2 : (dims.h - dims.k) / 2,
      width: dims.k,
      height: dims.k,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left 140ms ease"
    }
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-default-family)",
      ...style
    }
  }, control, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
/**
 * Upwind Card — surface container. Optional title/subtitle header and actions slot.
 * padding: default 16. Use `interactive` for hover elevation on clickable cards.
 */
function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 16,
  interactive = false,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const hasHeader = title || actions;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-8)",
      boxShadow: interactive && hover ? "var(--shadow-md)" : "var(--shadow-sm)",
      cursor: interactive ? "pointer" : "default",
      transition: "box-shadow 140ms ease, border-color 140ms ease",
      borderColor: interactive && hover ? "var(--border-primary)" : "var(--border-subtle)",
      overflow: "hidden",
      fontFamily: "var(--font-default-family)",
      ...style
    }
  }, hasHeader && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      padding: `14px ${padding}px`,
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-primary)"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flex: "none"
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// components/layout/MetricCard.jsx
try { (() => {
/**
 * Upwind MetricCard — KPI tile for dashboards. Big value, label, and optional trend.
 * trend: { value: string, direction: "up" | "down" }; tone colors the value/accent.
 */
function MetricCard({
  label,
  value,
  unit,
  trend,
  tone = "neutral",
  icon,
  style = {}
}) {
  const toneColor = {
    neutral: "var(--text-primary)",
    critical: "var(--severity-critical)",
    high: "var(--severity-high)",
    warning: "var(--severity-medium)",
    safe: "var(--severity-safe)",
    brand: "var(--action-primary)"
  }[tone] || "var(--text-primary)";
  const up = trend && trend.direction === "up";
  // For risk metrics, "up" is usually bad (red), "down" good (green).
  const trendColor = trend ? up ? "var(--severity-high)" : "var(--severity-safe)" : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-8)",
      boxShadow: "var(--shadow-sm)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontFamily: "var(--font-default-family)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--text-tertiary)"
    }
  }, icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 500,
      lineHeight: 1,
      color: toneColor,
      letterSpacing: "-0.01em"
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, unit)), trend && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      fontWeight: 500,
      color: trendColor
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, up ? "▲" : "▼"), trend.value));
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Upwind Tabs — underline tab bar. Controlled via `value`/`onChange`.
 * items: [{ id, label, count?, icon? }]
 */
function Tabs({
  items = [],
  value,
  onChange,
  style = {}
}) {
  const [hoverId, setHoverId] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "stretch",
      gap: 4,
      borderBottom: "1px solid var(--border-subtle)",
      fontFamily: "var(--font-default-family)",
      ...style
    }
  }, items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => onChange && onChange(it.id),
      onMouseEnter: () => setHoverId(it.id),
      onMouseLeave: () => setHoverId(null),
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "0 12px",
        height: 38,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-default-family)",
        fontSize: 14,
        fontWeight: 500,
        color: active ? "var(--text-primary)" : hoverId === it.id ? "var(--text-primary)" : "var(--text-secondary)",
        transition: "color 120ms ease"
      }
    }, it.icon && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex"
      }
    }, it.icon), it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 500,
        padding: "1px 6px",
        borderRadius: "var(--radius-pill)",
        background: active ? "var(--uw-primary-05)" : "var(--bg-tertiary)",
        color: active ? "var(--uw-primary-01)" : "var(--text-secondary)"
      }
    }, it.count), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: active ? "var(--action-primary)" : "transparent",
        borderRadius: "2px 2px 0 0"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// slides/deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: current slide index is saved to localStorage keyed by the
 * document path, so refresh returns you to the same place.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const STORAGE_PREFIX = 'deck-stage:slide:';
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._storageKey = STORAGE_PREFIX + (location.pathname || '/');
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      try {
        const raw = localStorage.getItem(this._storageKey);
        if (raw != null) {
          const n = parseInt(raw, 10);
          if (Number.isFinite(n) && n >= 0 && n < this._slides.length) {
            this._index = n;
          }
        }
      } catch (e) {/* ignore */}
    }
    _persistIndex() {
      try {
        localStorage.setItem(this._storageKey, String(this._index));
      } catch (e) {/* ignore */}
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      this._persistIndex();
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/deck-stage.js", error: String((e && e.message) || e) }); }

// ui_kits/console/Dashboard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Security Overview dashboard. window.Dashboard
const {
  Card,
  MetricCard,
  SeverityBadge,
  Badge,
  Button
} = window.UpwindDesignSystem_019df7;
const DUI = window.UpwindIcons;
function PageTitle({
  title,
  sub,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "uw-h1",
    style: {
      margin: 0,
      fontSize: 24
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 4
    }
  }, sub)), action);
}
function SeverityBars() {
  const data = window.KIT.severityBars;
  const max = Math.max(...data.map(d => d.count));
  const colors = {
    critical: "var(--severity-critical)",
    high: "var(--severity-high)",
    medium: "var(--severity-medium)",
    low: "var(--severity-low)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, data.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.level,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  }, d.label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 10,
      background: "var(--bg-tertiary)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: d.count / max * 100 + "%",
      height: "100%",
      background: colors[d.level],
      borderRadius: "var(--radius-pill)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      textAlign: "right",
      fontSize: 13,
      fontWeight: 500
    }
  }, d.count))));
}
function Sparkline() {
  // simple inline area sparkline
  const pts = [18, 22, 19, 28, 24, 31, 27, 35, 30, 38, 34, 42];
  const w = 100,
    h = 40,
    max = Math.max(...pts),
    min = Math.min(...pts);
  const x = i => i / (pts.length - 1) * w;
  const y = v => h - (v - min) / (max - min) * (h - 6) - 3;
  const line = pts.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: "100%",
    height: "60",
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: `0,${h} ${line} ${w},${h}`,
    fill: "var(--uw-primary-05)",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: line,
    fill: "none",
    stroke: "var(--action-primary)",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke"
  }));
}
function Dashboard() {
  const k = window.KIT;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageTitle, {
    title: "Security Overview",
    sub: "Runtime-prioritized risk across all connected clouds \xB7 updated 2m ago",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: DUI.external({
        size: 15
      })
    }, "Export"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: DUI.plus({
        size: 16
      })
    }, "Add integration"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
      marginBottom: 16
    }
  }, k.metrics.map(m => /*#__PURE__*/React.createElement(MetricCard, _extends({
    key: m.label
  }, m, {
    icon: DUI.trend({
      size: 16
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 16,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Open findings",
    subtitle: "497 total \xB7 runtime-prioritized",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      iconRight: DUI.chevronRight({
        size: 14
      })
    }, "All findings")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement(SeverityBars, null))), /*#__PURE__*/React.createElement(Card, {
    title: "Exploitable risk trend",
    subtitle: "Last 12 weeks"
  }, /*#__PURE__*/React.createElement(Sparkline, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8,
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "12 weeks ago"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--severity-high)",
      fontWeight: 500
    }
  }, "\u25B2 18% exposed")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Top vulnerabilities",
    subtitle: "Active in production",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "View all")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, k.findings.slice(0, 5).map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderTop: i ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(SeverityBadge, {
    level: f.level,
    variant: "dot",
    label: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono-family)",
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  }, f.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, f.title)), f.runtime && /*#__PURE__*/React.createElement(Badge, {
    color: "blue"
  }, "runtime"), /*#__PURE__*/React.createElement(SeverityBadge, {
    level: f.level
  }))))), /*#__PURE__*/React.createElement(Card, {
    title: "Recent threats",
    subtitle: "Real-time detection (CDR)",
    actions: /*#__PURE__*/React.createElement(Badge, {
      color: "red",
      variant: "solid"
    }, "Live")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, k.threats.slice(0, 5).map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderTop: i ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(SeverityBadge, {
    level: t.sev,
    variant: "dot",
    label: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-secondary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, t.resource, " \xB7 ", t.tactic)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono-family)",
      fontSize: 11,
      color: "var(--text-tertiary)"
    }
  }, t.time)))))));
}
window.Dashboard = Dashboard;
window.PageTitle = PageTitle;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/Findings.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Findings table view. window.Findings
const {
  Tabs,
  SeverityBadge,
  Badge,
  Button,
  Input,
  IconButton
} = window.UpwindDesignSystem_019df7;
const FUI = window.UpwindIcons;
const FilterChip = ({
  label,
  active,
  color,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 28,
    padding: "0 12px",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-default-family)",
    border: active ? `1px solid ${color || "var(--action-primary)"}` : "1px solid var(--border-subtle)",
    background: active ? color ? "transparent" : "var(--uw-primary-05)" : "var(--surface)",
    color: active ? color || "var(--uw-primary-01)" : "var(--text-secondary)"
  }
}, color && /*#__PURE__*/React.createElement("span", {
  style: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color
  }
}), label);
const TH = ({
  children,
  w
}) => /*#__PURE__*/React.createElement("th", {
  style: {
    textAlign: "left",
    padding: "0 12px",
    height: 36,
    fontSize: 11,
    fontWeight: 500,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    width: w
  }
}, children);
const TD = ({
  children,
  mono,
  ...r
}) => /*#__PURE__*/React.createElement("td", _extends({
  style: {
    padding: "0 12px",
    height: 48,
    fontSize: 13,
    fontFamily: mono ? "var(--font-mono-family)" : "inherit",
    color: "var(--text-primary)",
    borderTop: "1px solid var(--border-subtle)"
  }
}, r), children);
function Findings() {
  const all = window.KIT.findings;
  const [sev, setSev] = React.useState("all");
  const [tab, setTab] = React.useState("findings");
  const [hover, setHover] = React.useState(null);
  const rows = sev === "all" ? all : all.filter(f => f.level === sev);
  const count = l => all.filter(f => f.level === l).length;
  const sevColors = {
    critical: "var(--severity-critical)",
    high: "var(--severity-high)",
    medium: "var(--severity-medium)",
    low: "var(--severity-low)"
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(window.PageTitle, {
    title: "Findings",
    sub: "Vulnerabilities, misconfigurations and exposures \u2014 sorted by runtime exploitability",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: FUI.external({
        size: 15
      })
    }, "Export CSV"))
  }), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: "findings",
      label: "All findings",
      count: all.length
    }, {
      id: "vuln",
      label: "Vulnerabilities",
      count: 5
    }, {
      id: "cspm",
      label: "Misconfigurations",
      count: 3
    }, {
      id: "suppressed",
      label: "Suppressed",
      count: 1
    }],
    style: {
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: FUI.search({
      size: 14
    }),
    placeholder: "Filter by CVE, resource\u2026"
  })), /*#__PURE__*/React.createElement(FilterChip, {
    label: "All",
    active: sev === "all",
    onClick: () => setSev("all")
  }), /*#__PURE__*/React.createElement(FilterChip, {
    label: `Critical · ${count("critical")}`,
    color: sevColors.critical,
    active: sev === "critical",
    onClick: () => setSev("critical")
  }), /*#__PURE__*/React.createElement(FilterChip, {
    label: `High · ${count("high")}`,
    color: sevColors.high,
    active: sev === "high",
    onClick: () => setSev("high")
  }), /*#__PURE__*/React.createElement(FilterChip, {
    label: `Medium · ${count("medium")}`,
    color: sevColors.medium,
    active: sev === "medium",
    onClick: () => setSev("medium")
  }), /*#__PURE__*/React.createElement(FilterChip, {
    label: `Low · ${count("low")}`,
    color: sevColors.low,
    active: sev === "low",
    onClick: () => setSev("low")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: FUI.filter({
      size: 14
    })
  }, "More filters")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-8)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: {
      background: "var(--bg-secondary)"
    }
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(TH, {
    w: "56"
  }), /*#__PURE__*/React.createElement(TH, null, "Finding"), /*#__PURE__*/React.createElement(TH, null, "Resource"), /*#__PURE__*/React.createElement(TH, null, "Cloud"), /*#__PURE__*/React.createElement(TH, null, "Package"), /*#__PURE__*/React.createElement(TH, null, "Status"), /*#__PURE__*/React.createElement(TH, null, "Detected"), /*#__PURE__*/React.createElement(TH, {
    w: "44"
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map(f => /*#__PURE__*/React.createElement("tr", {
    key: f.id,
    onMouseEnter: () => setHover(f.id),
    onMouseLeave: () => setHover(null),
    style: {
      background: hover === f.id ? "var(--interactive-hover)" : "transparent",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(SeverityBadge, {
    level: f.level,
    variant: "dot",
    label: ""
  })), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono-family)",
      fontSize: 11,
      color: "var(--text-secondary)"
    }
  }, f.id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, f.title, f.runtime && /*#__PURE__*/React.createElement(Badge, {
    color: "blue"
  }, "runtime"))), /*#__PURE__*/React.createElement(TD, {
    mono: true
  }, f.resource), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(Badge, {
    color: "neutral"
  }, f.cloud, " \xB7 ", f.region)), /*#__PURE__*/React.createElement(TD, {
    mono: true
  }, f.pkg), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(Badge, {
    color: f.status === "Open" ? "amber" : f.status === "In progress" ? "blue" : "neutral"
  }, f.status)), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)",
      fontSize: 12
    }
  }, f.age)), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    title: "Actions"
  }, FUI.dots({
    size: 16
  })))))))));
}
window.Findings = Findings;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/Findings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/Inventory.jsx
try { (() => {
// Inventory view. window.Inventory
const {
  SeverityBadge,
  Badge,
  Button,
  Input
} = window.UpwindDesignSystem_019df7;
const IUI = window.UpwindIcons;
const kindIcon = {
  Container: "box",
  VM: "server",
  Identity: "fingerprint",
  "S3 Bucket": "database"
};
function Inventory() {
  const rows = window.KIT.inventory;
  const [hover, setHover] = React.useState(null);
  const TH = ({
    children
  }) => /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "0 12px",
      height: 36,
      fontSize: 11,
      fontWeight: 500,
      color: "var(--text-tertiary)",
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    }
  }, children);
  const TD = ({
    children,
    mono
  }) => /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "0 12px",
      height: 52,
      fontSize: 13,
      fontFamily: mono ? "var(--font-mono-family)" : "inherit",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, children);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(window.PageTitle, {
    title: "Inventory",
    sub: "Every workload, identity and data store Upwind sees \u2014 with live runtime context",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: IUI.network({
        size: 15
      })
    }, "Topology map")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: IUI.search({
      size: 14
    }),
    placeholder: "Search resources\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 12px",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-4)",
      fontSize: 13,
      color: "var(--text-secondary)",
      height: 32
    }
  }, IUI.layers({
    size: 14
  }), " All types ", IUI.chevronDown({
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 12px",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-4)",
      fontSize: 13,
      color: "var(--text-secondary)",
      height: 32
    }
  }, IUI.globe({
    size: 14
  }), " All clouds ", IUI.chevronDown({
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-8)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: {
      background: "var(--bg-secondary)"
    }
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(TH, null, "Resource"), /*#__PURE__*/React.createElement(TH, null, "Type"), /*#__PURE__*/React.createElement(TH, null, "Cloud / Region"), /*#__PURE__*/React.createElement(TH, null, "Cluster"), /*#__PURE__*/React.createElement(TH, null, "Risk"), /*#__PURE__*/React.createElement(TH, null, "Findings"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.name,
    onMouseEnter: () => setHover(r.name),
    onMouseLeave: () => setHover(null),
    style: {
      background: hover === r.name ? "var(--interactive-hover)" : "transparent",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 30,
      height: 30,
      borderRadius: "var(--radius-4)",
      background: "var(--bg-tertiary)",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-secondary)",
      flex: "none"
    }
  }, IUI[kindIcon[r.kind] || "box"]({
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono-family)",
      fontSize: 13
    }
  }, r.name))), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(Badge, {
    color: "neutral"
  }, r.kind)), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)"
    }
  }, r.cloud, " \xB7 ", r.region)), /*#__PURE__*/React.createElement(TD, {
    mono: true
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.cluster === "—" ? "var(--text-tertiary)" : "var(--text-primary)"
    }
  }, r.cluster)), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement(SeverityBadge, {
    level: r.risk
  })), /*#__PURE__*/React.createElement(TD, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, r.findings), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)",
      fontSize: 12
    }
  }, "open"))))))));
}
window.Inventory = Inventory;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/Inventory.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/Shell.jsx
try { (() => {
// Console shell: collapsible sidebar + top bar. Exposes window.Shell.
const {
  Avatar,
  IconButton,
  Input,
  StatusDot
} = window.UpwindDesignSystem_019df7;
const UI = window.UpwindIcons;
const NAV = [{
  id: "dashboard",
  label: "Security Overview",
  icon: "shield"
}, {
  id: "findings",
  label: "Findings",
  icon: "alert",
  count: 142
}, {
  id: "inventory",
  label: "Inventory",
  icon: "layers"
}, {
  id: "threats",
  label: "Threat Detection",
  icon: "activity",
  live: true
}];
const NAV2 = [{
  id: "vuln",
  label: "Vulnerabilities",
  icon: "box"
}, {
  id: "cspm",
  label: "Posture",
  icon: "cloud"
}, {
  id: "dspm",
  label: "Data",
  icon: "database"
}, {
  id: "identity",
  label: "Identity",
  icon: "fingerprint"
}, {
  id: "api",
  label: "API Security",
  icon: "network"
}];
function NavItem({
  item,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const on = active === item.id;
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onClick(item.id),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "0 10px",
      height: 34,
      border: "none",
      borderRadius: "var(--radius-4)",
      background: on ? "var(--uw-primary-05)" : hover ? "var(--interactive-hover)" : "transparent",
      color: on ? "var(--uw-primary-01)" : "var(--text-secondary)",
      cursor: "pointer",
      fontFamily: "var(--font-default-family)",
      fontSize: 13,
      fontWeight: on ? 500 : 400,
      textAlign: "left",
      transition: "background 120ms ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "none",
      color: on ? "var(--uw-primary-02)" : "var(--text-tertiary)"
    }
  }, UI[item.icon]({
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, item.label), item.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      padding: "1px 6px",
      borderRadius: "var(--radius-pill)",
      background: on ? "var(--uw-white)" : "var(--bg-tertiary)",
      color: "var(--text-secondary)"
    }
  }, item.count), item.live && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--severity-safe)",
      flex: "none"
    }
  }));
}
function Shell({
  view,
  setView,
  dark,
  setDark,
  children
}) {
  const wordmark = dark ? "../../assets/upwind_wordmark.svg" : "../../assets/upwind_wordmark_navy.svg";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100vh",
      width: "100%",
      background: "var(--bg-secondary)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-default-family)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: "var(--upwind-sidebar-width)",
      flex: "none",
      background: "var(--surface)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "var(--upwind-header-height)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: wordmark,
    alt: "Upwind",
    style: {
      height: 22
    }
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      overflowY: "auto"
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement(NavItem, {
    key: n.id,
    item: n,
    active: view,
    onClick: setView
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.06em",
      color: "var(--text-tertiary)",
      textTransform: "uppercase",
      padding: "16px 10px 6px"
    }
  }, "Pillars"), NAV2.map(n => /*#__PURE__*/React.createElement(NavItem, {
    key: n.id,
    item: n,
    active: view,
    onClick: setView
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(StatusDot, {
    status: "online",
    label: "3 sensors connected",
    pulse: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--upwind-header-height)",
      flex: "none",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: UI.search({
      size: 14
    }),
    placeholder: "Search resources, findings, CVEs\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-4)",
      fontSize: 13,
      color: "var(--text-secondary)",
      cursor: "pointer"
    }
  }, UI.globe({
    size: 14
  }), " All clouds ", UI.chevronDown({
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    title: "Toggle theme",
    onClick: () => setDark(!dark)
  }, dark ? UI.sun({
    size: 17
  }) : UI.moon({
    size: 17
  })), /*#__PURE__*/React.createElement(IconButton, {
    title: "Notifications"
  }, UI.bell({
    size: 17
  })), /*#__PURE__*/React.createElement(IconButton, {
    title: "Settings"
  }, UI.settings({
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 24,
      background: "var(--border-subtle)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Maya Rosen",
    size: 30
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "Maya Rosen"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-tertiary)"
    }
  }, "Acme Corp")))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 24
    }
  }, children)));
}
window.Shell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/Threats.jsx
try { (() => {
// Threat Detection (CDR) live feed. window.Threats
const {
  SeverityBadge,
  Badge,
  Button,
  Card,
  StatusDot
} = window.UpwindDesignSystem_019df7;
const TUI = window.UpwindIcons;
function Threats() {
  const events = window.KIT.threats;
  const [selected, setSelected] = React.useState(events[0]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(window.PageTitle, {
    title: "Threat Detection",
    sub: "Real-time runtime detections from the eBPF sensor \u2014 mapped to MITRE ATT&CK",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(StatusDot, {
      status: "online",
      label: "Streaming",
      pulse: true
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Detection rules"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-8)",
      overflow: "hidden"
    }
  }, events.map((e, i) => {
    const on = selected === e;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => setSelected(e),
      style: {
        display: "flex",
        gap: 12,
        padding: "14px 16px",
        cursor: "pointer",
        borderTop: i ? "1px solid var(--border-subtle)" : "none",
        borderLeft: on ? "3px solid var(--action-primary)" : "3px solid transparent",
        background: on ? "var(--uw-primary-06)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono-family)",
        fontSize: 12,
        color: "var(--text-tertiary)",
        flex: "none",
        paddingTop: 2
      }
    }, e.time), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement(SeverityBadge, {
      level: e.sev
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500
      }
    }, e.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-secondary)",
        fontFamily: "var(--font-mono-family)"
      }
    }, e.detail), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      color: "neutral"
    }, e.resource), e.tactic !== "—" && /*#__PURE__*/React.createElement(Badge, {
      color: "purple"
    }, e.tactic))));
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Event detail",
    subtitle: selected.title,
    actions: /*#__PURE__*/React.createElement(Badge, {
      color: "red",
      variant: "solid"
    }, selected.sev)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Detail, {
    icon: "server",
    label: "Resource",
    value: selected.resource,
    mono: true
  }), /*#__PURE__*/React.createElement(Detail, {
    icon: "clock",
    label: "Time",
    value: selected.time,
    mono: true
  }), /*#__PURE__*/React.createElement(Detail, {
    icon: "shieldAlert",
    label: "MITRE tactic",
    value: selected.tactic
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      color: "var(--text-tertiary)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 6
    }
  }, "Evidence"), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-4)",
      padding: 12,
      fontFamily: "var(--font-mono-family)",
      fontSize: 12,
      color: "var(--text-primary)",
      whiteSpace: "pre-wrap"
    }
  }, selected.detail)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    fullWidth: true,
    icon: TUI.lock({
      size: 15
    })
  }, "Isolate workload"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true
  }, "Investigate"))))));
}
function Detail({
  icon,
  label,
  value,
  mono
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)",
      flex: "none"
    }
  }, TUI[icon]({
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-secondary)",
      width: 92,
      flex: "none"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontFamily: mono ? "var(--font-mono-family)" : "inherit"
    }
  }, value));
}
window.Threats = Threats;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/Threats.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/data.jsx
try { (() => {
// Mock data for the Upwind console UI kit.
const KIT = {
  metrics: [{
    label: "Critical findings",
    value: "12",
    tone: "critical",
    trend: {
      value: "+3 this week",
      direction: "up"
    }
  }, {
    label: "High findings",
    value: "47",
    tone: "high",
    trend: {
      value: "-8 this week",
      direction: "down"
    }
  }, {
    label: "Workloads protected",
    value: "1,284",
    tone: "safe",
    trend: {
      value: "+62",
      direction: "up"
    }
  }, {
    label: "Mean time to remediate",
    value: "2.4",
    unit: "days",
    tone: "brand",
    trend: {
      value: "-0.6d",
      direction: "down"
    }
  }],
  severityBars: [{
    level: "critical",
    label: "Critical",
    count: 12
  }, {
    level: "high",
    label: "High",
    count: 47
  }, {
    level: "medium",
    label: "Medium",
    count: 138
  }, {
    level: "low",
    label: "Low",
    count: 264
  }],
  findings: [{
    id: "CVE-2024-3094",
    title: "Backdoor in xz-utils (liberzma)",
    level: "critical",
    resource: "checkout-api",
    cloud: "AWS",
    region: "us-east-1",
    runtime: true,
    pkg: "xz-utils@5.6.1",
    age: "4m ago",
    status: "Open"
  }, {
    id: "UW-CSPM-0241",
    title: "S3 bucket publicly readable",
    level: "high",
    resource: "billing-exports",
    cloud: "AWS",
    region: "us-east-1",
    runtime: false,
    pkg: "—",
    age: "32m ago",
    status: "Open"
  }, {
    id: "CVE-2023-44487",
    title: "HTTP/2 Rapid Reset DoS",
    level: "high",
    resource: "edge-gateway",
    cloud: "GCP",
    region: "europe-west1",
    runtime: true,
    pkg: "nginx@1.25.2",
    age: "1h ago",
    status: "In progress"
  }, {
    id: "UW-IAM-0098",
    title: "Overprivileged service account",
    level: "high",
    resource: "data-pipeline-sa",
    cloud: "GCP",
    region: "global",
    runtime: true,
    pkg: "—",
    age: "2h ago",
    status: "Open"
  }, {
    id: "CVE-2024-21626",
    title: "runc container escape",
    level: "medium",
    resource: "ml-trainer",
    cloud: "AWS",
    region: "us-west-2",
    runtime: false,
    pkg: "runc@1.1.9",
    age: "3h ago",
    status: "Open"
  }, {
    id: "UW-DSPM-0512",
    title: "PII exposed on unauthenticated endpoint",
    level: "critical",
    resource: "user-profile-api",
    cloud: "Azure",
    region: "eastus",
    runtime: true,
    pkg: "—",
    age: "5h ago",
    status: "Open"
  }, {
    id: "CVE-2023-5678",
    title: "OpenSSL DH key generation DoS",
    level: "medium",
    resource: "auth-service",
    cloud: "AWS",
    region: "us-east-1",
    runtime: false,
    pkg: "openssl@3.0.11",
    age: "6h ago",
    status: "In progress"
  }, {
    id: "UW-CSPM-0188",
    title: "Security group allows 0.0.0.0/0 on 22",
    level: "medium",
    resource: "bastion-host",
    cloud: "AWS",
    region: "us-east-1",
    runtime: false,
    pkg: "—",
    age: "8h ago",
    status: "Open"
  }, {
    id: "CVE-2022-0847",
    title: "Dirty Pipe local privilege escalation",
    level: "low",
    resource: "legacy-batch",
    cloud: "GCP",
    region: "us-central1",
    runtime: false,
    pkg: "linux-kernel@5.16",
    age: "1d ago",
    status: "Suppressed"
  }],
  threats: [{
    time: "14:32:08",
    sev: "critical",
    title: "Reverse shell spawned",
    detail: "/bin/sh connected to 185.220.101.42:4444",
    resource: "checkout-api",
    tactic: "Execution"
  }, {
    time: "14:29:51",
    sev: "high",
    title: "Crypto-mining binary executed",
    detail: "xmrig launched from /tmp/.cache",
    resource: "ml-trainer",
    tactic: "Impact"
  }, {
    time: "14:18:30",
    sev: "high",
    title: "Unusual outbound data transfer",
    detail: "2.4 GB to unrecognized S3 bucket",
    resource: "billing-exports",
    tactic: "Exfiltration"
  }, {
    time: "13:57:12",
    sev: "medium",
    title: "New SSH session",
    detail: "root login from 10.0.4.21",
    resource: "bastion-host",
    tactic: "Initial Access"
  }, {
    time: "13:44:05",
    sev: "medium",
    title: "Package manager invoked at runtime",
    detail: "apt-get install netcat",
    resource: "edge-gateway",
    tactic: "Defense Evasion"
  }, {
    time: "13:20:47",
    sev: "info",
    title: "Sensor deployed",
    detail: "eBPF sensor connected on node ip-10-0-1-88",
    resource: "prod-eks",
    tactic: "—"
  }],
  inventory: [{
    name: "checkout-api",
    kind: "Container",
    cloud: "AWS",
    region: "us-east-1",
    cluster: "prod-eks",
    risk: "critical",
    findings: 5
  }, {
    name: "user-profile-api",
    kind: "Container",
    cloud: "Azure",
    region: "eastus",
    cluster: "prod-aks",
    risk: "critical",
    findings: 3
  }, {
    name: "edge-gateway",
    kind: "VM",
    cloud: "GCP",
    region: "europe-west1",
    cluster: "—",
    risk: "high",
    findings: 4
  }, {
    name: "data-pipeline-sa",
    kind: "Identity",
    cloud: "GCP",
    region: "global",
    cluster: "—",
    risk: "high",
    findings: 2
  }, {
    name: "billing-exports",
    kind: "S3 Bucket",
    cloud: "AWS",
    region: "us-east-1",
    cluster: "—",
    risk: "high",
    findings: 1
  }, {
    name: "ml-trainer",
    kind: "Container",
    cloud: "AWS",
    region: "us-west-2",
    cluster: "ml-eks",
    risk: "medium",
    findings: 6
  }, {
    name: "auth-service",
    kind: "Container",
    cloud: "AWS",
    region: "us-east-1",
    cluster: "prod-eks",
    risk: "medium",
    findings: 2
  }, {
    name: "bastion-host",
    kind: "VM",
    cloud: "AWS",
    region: "us-east-1",
    cluster: "—",
    risk: "medium",
    findings: 1
  }]
};
window.KIT = KIT;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/console/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide-style stroke icons (24px grid, 2px stroke). Self-contained — no CDN.
// SUBSTITUTION NOTE: Upwind's product icons are not in this kit; these are the
// closest open-source match (Lucide geometry/weight). See readme ICONOGRAPHY.
const Icon = ({
  d,
  paths,
  size = 16,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  style,
  children
}) => React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill,
  stroke,
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style
}, children || (paths ? paths.map((p, i) => React.createElement("path", {
  key: i,
  d: p
})) : React.createElement("path", {
  d
})));
const I = {
  shield: p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
    paths: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"]
  })),
  shieldAlert: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 16h.01"
  })),
  layers: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6.08 9.5-3.48 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.92 9.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6.08 14.5-3.48 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.49-1.59"
  })),
  box: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.3 7 8.7 5 8.7-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 22V12"
  })),
  network: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    x: "16",
    y: "16",
    width: "6",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "16",
    width: "6",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "2",
    width: "6",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 12V8"
  })),
  key: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 2-9.6 9.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "15.5",
    r: "5.5"
  })),
  database: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "5",
    rx: "9",
    ry: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 5V19A9 3 0 0 0 21 19V5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12A9 3 0 0 0 21 12"
  })),
  search: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  bell: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M10.268 21a2 2 0 0 0 3.464 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
  })),
  settings: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  chevronRight: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })),
  chevronDown: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })),
  chevronsLeft: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m11 17-5-5 5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m18 17-5-5 5-5"
  })),
  filter: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 4.6A.6.6 0 0 1 3.6 4h16.8a.6.6 0 0 1 .6.6v1.17a.6.6 0 0 1-.176.424l-6.648 6.648a.6.6 0 0 0-.176.424v6.281a.6.6 0 0 1-.866.536l-2.667-1.333A.6.6 0 0 1 10 18.82v-5.55a.6.6 0 0 0-.176-.425L3.176 6.197A.6.6 0 0 1 3 5.773z"
  })),
  dots: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "5",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "19",
    r: "1"
  })),
  plus: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  })),
  external: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M15 3h6v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 14 21 3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
  })),
  alert: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 17h.01"
  })),
  check: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })),
  clock: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  })),
  cloud: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
  })),
  server: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "8",
    x: "2",
    y: "2",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "8",
    x: "2",
    y: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 6h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 18h.01"
  })),
  git: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 9v6a3 3 0 0 0 3 3h7"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 9v0a6 6 0 0 1-6 6"
  })),
  activity: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
  })),
  eye: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  user: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  })),
  sun: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 20v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m4.93 4.93 1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m17.66 17.66 1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 12h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6.34 17.66-1.41 1.41"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m19.07 4.93-1.41 1.41"
  })),
  moon: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
  })),
  trend: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M16 7h6v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m22 7-8.5 8.5-5-5L2 17"
  })),
  globe: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h20"
  })),
  lock: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "11",
    x: "3",
    y: "11",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 11V7a5 5 0 0 1 10 0v4"
  })),
  fingerprint: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 13.12c0 2.38 0 6.38-1 8.88"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17.29 21.02c.12-.6.43-2.3.5-3.02"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12a10 10 0 0 1 18-6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 16h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21.8 16c.2-2 .131-5.354 0-6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.65 22c.21-.66.45-1.32.57-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 6.8a6 6 0 0 1 9 5.2v2"
  }))
};
window.UpwindIcons = I;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/console/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/sections.jsx
try { (() => {
// Upwind marketing site sections. Exposes window.Site.
const {
  Button,
  Badge
} = window.UpwindDesignSystem_019df7;
const MAXW = 1120;
const Container = ({
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: MAXW,
    margin: "0 auto",
    padding: "0 32px",
    ...style
  }
}, children);
function Nav() {
  const link = {
    fontSize: 14,
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer"
  };
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "rgba(255,255,255,0.8)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Container, {
    style: {
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/upwind_wordmark_navy.svg",
    alt: "Upwind",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 24,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Platform"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Solutions"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Resources"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Company"), /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Pricing")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("a", {
    style: {
      ...link,
      color: "var(--text-primary)"
    }
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Get a demo")));
}
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      overflow: "hidden",
      paddingTop: 80,
      paddingBottom: 64
    }
  }, /*#__PURE__*/React.createElement(Container, {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 12px 5px 8px",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-pill)",
      background: "var(--surface)",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginBottom: 28,
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    color: "blue",
    variant: "solid"
  }, "New"), " Now live inside AWS Security Hub \u2192"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-default-family)",
      fontSize: 64,
      lineHeight: 1.04,
      letterSpacing: "-0.03em",
      fontWeight: 700,
      margin: 0,
      color: "var(--text-primary)"
    }
  }, "Cloud & AI security", /*#__PURE__*/React.createElement("br", null), "for the ", /*#__PURE__*/React.createElement("span", {
    className: "uw-gradient-text"
  }, "realtime era")), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 620,
      margin: "24px auto 0",
      fontSize: 18,
      lineHeight: 1.55,
      color: "var(--text-secondary)"
    }
  }, "Upwind unifies application security, posture, and real-time protection on a single runtime-powered platform \u2014 so your team can focus on what's actually exposed."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      justifyContent: "center",
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Get a demo"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Explore the platform")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 56,
      borderRadius: "var(--radius-16)",
      overflow: "hidden",
      border: "1px solid var(--border-subtle)",
      boxShadow: "0 30px 60px -20px rgba(24,32,45,0.35)",
      background: "var(--surface)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 38,
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "0 14px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: "#FF5F57"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: "#FEBC2E"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: "#28C840"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      margin: "0 auto",
      fontSize: 12,
      color: "var(--text-tertiary)",
      fontFamily: "var(--font-mono-family)"
    }
  }, "console.upwind.io")), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/console-screenshot.png",
    alt: "Upwind console",
    style: {
      display: "block",
      width: "100%"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -120,
      left: "50%",
      transform: "translateX(-50%)",
      width: 900,
      height: 360,
      background: "var(--upwind-theme-gradient)",
      filter: "blur(120px)",
      opacity: 0.18,
      zIndex: -1,
      borderRadius: "50%"
    }
  }));
}
function Logos() {
  const names = ["Wiz", "Rapid7", "DataStax", "Outbrain", "Lemonade", "Hippo"];
  return /*#__PURE__*/React.createElement(Container, {
    style: {
      padding: "32px 32px 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      marginBottom: 24
    }
  }, "Rated 4.9 / 5 on Gartner Peer Insights for CNAPP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 24,
      opacity: 0.55
    }
  }, names.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text-secondary)",
      letterSpacing: "-0.02em"
    }
  }, n))));
}
const PILLARS = [{
  illo: "manCatchingAWave",
  tag: "Application Security",
  title: "Shift left, with runtime truth",
  body: "Enforce guardrails early to prevent risk before code ever reaches the cloud — from your Git repo to the running service."
}, {
  illo: "surfboardsInSand",
  tag: "Security Posture",
  title: "See what's actually exposed",
  body: "Gain real-time visibility into live cloud workloads, services, and data flows. Cut through CSPM noise with runtime context."
}, {
  illo: "manSittingOnSurfBoard",
  tag: "Realtime Protection",
  title: "Detect and stop threats live",
  body: "Continuously detect and stop runtime threats across APIs, AI, and applications with Upwind's eBPF sensor."
}];
function Pillars() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "80px 0"
    }
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--uw-primary-02)",
      marginBottom: 12
    }
  }, "One platform"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-default-family)",
      fontSize: 40,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      margin: 0
    }
  }, "Security across the entire cloud lifecycle")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 24
    }
  }, PILLARS.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.tag,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-16)",
      padding: 28,
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-tertiary)",
      borderRadius: "var(--radius-8)",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/" + p.illo + ".svg",
    alt: "",
    style: {
      height: 96,
      borderRadius: 8
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--uw-primary-02)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    }
  }, p.tag), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-default-family)",
      fontSize: 20,
      fontWeight: 500,
      margin: "0 0 8px"
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      margin: 0
    }
  }, p.body))))));
}
function Stats() {
  const stats = [{
    n: "10×",
    l: "faster triage with runtime context"
  }, {
    n: "1 platform",
    l: "replaces fragmented CSPM, CDR & CNAPP tools"
  }, {
    n: "<5 min",
    l: "to deploy the eBPF sensor"
  }, {
    n: "4.9/5",
    l: "Gartner Peer Insights rating"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "8px 0 72px"
    }
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 24,
      padding: "40px 32px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-16)"
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "uw-gradient-text",
    style: {
      fontSize: 38,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 8,
      lineHeight: 1.4
    }
  }, s.l))))));
}
function Testimonial() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "16px 0 80px"
    }
  }, /*#__PURE__*/React.createElement(Container, {
    style: {
      maxWidth: 820,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      color: "var(--text-primary)"
    }
  }, "\"Upwind truly acts as a ", /*#__PURE__*/React.createElement("span", {
    className: "uw-gradient-text"
  }, "single pane of glass"), " for our security team \u2014 consolidating multiple products while giving engineers end-to-end visibility.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      fontSize: 14,
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-primary)",
      fontWeight: 500
    }
  }, "Ophir Zahavi"), " \xB7 Head of Cloud Engineering")));
}
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "0 32px 80px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: MAXW,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-24)",
      background: "#171A1C",
      padding: "72px 48px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--upwind-theme-gradient)",
      opacity: 0.9,
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-default-family)",
      fontSize: 44,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: "#fff",
      margin: 0
    }
  }, "Welcome to the future", /*#__PURE__*/React.createElement("br", null), "of cloud security"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: "rgba(255,255,255,0.85)",
      maxWidth: 520,
      margin: "20px auto 0"
    }
  }, "See Upwind in action and take your cloud security to the next level."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      justifyContent: "center",
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      height: 44,
      padding: "0 24px",
      border: "none",
      borderRadius: "var(--radius-4)",
      background: "#fff",
      color: "var(--text-primary)",
      fontSize: 15,
      fontWeight: 500,
      fontFamily: "var(--font-default-family)",
      cursor: "pointer"
    }
  }, "Get a demo"), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 44,
      padding: "0 24px",
      border: "1px solid rgba(255,255,255,0.5)",
      borderRadius: "var(--radius-4)",
      background: "transparent",
      color: "#fff",
      fontSize: 15,
      fontWeight: 500,
      fontFamily: "var(--font-default-family)",
      cursor: "pointer"
    }
  }, "Contact sales")))));
}
function Footer() {
  const cols = [{
    h: "Platform",
    items: ["Vulnerability Management", "CSPM", "DSPM", "Container Security", "API Security", "Identity Security"]
  }, {
    h: "Company",
    items: ["About", "Careers", "Blog", "Newsroom", "Contact"]
  }, {
    h: "Resources",
    items: ["Documentation", "Trust Center", "Integrations", "Case Studies"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--bg-secondary)",
      padding: "56px 0 32px"
    }
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/upwind_wordmark_navy.svg",
    alt: "Upwind",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 16,
      maxWidth: 240,
      lineHeight: 1.5
    }
  }, "The runtime-powered CNAPP. Up and Upwind. \uD83C\uDFC4")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 14
    }
  }, c.h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, c.items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      textDecoration: "none",
      cursor: "pointer"
    }
  }, it)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      paddingTop: 24,
      borderTop: "1px solid var(--border-subtle)",
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "var(--text-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Upwind Security. All rights reserved."), /*#__PURE__*/React.createElement("span", null, "SOC 2 \xB7 ISO 27001 \xB7 ISO 27002"))));
}
function Site() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bg-primary)",
      fontFamily: "var(--font-default-family)",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Logos, null), /*#__PURE__*/React.createElement(Pillars, null), /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement(Testimonial, null), /*#__PURE__*/React.createElement(CTA, null), /*#__PURE__*/React.createElement(Footer, null));
}
window.Site = Site;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/sections.jsx", error: String((e && e.message) || e) }); }

// uploads/deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: current slide index is saved to localStorage keyed by the
 * document path, so refresh returns you to the same place.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const STORAGE_PREFIX = 'deck-stage:slide:';
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._storageKey = STORAGE_PREFIX + (location.pathname || '/');
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      try {
        const raw = localStorage.getItem(this._storageKey);
        if (raw != null) {
          const n = parseInt(raw, 10);
          if (Number.isFinite(n) && n >= 0 && n < this._slides.length) {
            this._index = n;
          }
        }
      } catch (e) {/* ignore */}
    }
    _persistIndex() {
      try {
        localStorage.setItem(this._storageKey, String(this._index));
      } catch (e) {/* ignore */}
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      this._persistIndex();
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "uploads/deck-stage.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.SeverityBadge = __ds_scope.SeverityBadge;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
