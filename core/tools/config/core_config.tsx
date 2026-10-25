import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

import { COUNTRIES, LANGUAGES, timezonesFor } from "./config_data";
import type { LogSink, LogLine } from "./config_logs";
import {
  EMPTY_HARDWARE,
  EMPTY_MACHINE,
  printHardware,
  readHardware,
  type ComputerHardware,
  type Hardware,
} from "./config_hardware";
import {
  detectedIdentity,
  identityProblem,
  withCountry,
  type ComputerIdentity,
} from "./core_config";





const ink = "#ECEAE5";
const dim = "#9A968E";
const edge = "#26282C";
const edgeLoud = "#3A3E45";
const fieldGround = "#212121";
const listGround = "#0E0E0E";
const white = "#FFFFFF";
const accent = "#D6E2F0";

const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const stageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};


const box: CSSProperties = {
  position: "relative",
  width: "min(66%, 60vh)",
  aspectRatio: "1 / 1",
  boxSizing: "border-box",
};

const face: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxSizing: "border-box",
  padding: "6%",
  background: "#0E0E0E",
  border: `1px solid ${edge}`,
  color: ink,
  overflow: "hidden",
};


const viewport: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden",
};


const pages = (page: number): CSSProperties => ({
  display: "flex",
  width: "300%",
  height: "100%",
  transform: `translateX(${page * -(100 / 3)}%)`,
  transition: "transform 240ms ease",
});

const aPage: CSSProperties = {
  width: `${100 / 3}%`,
  flex: "none",
  height: "100%",
  overflow: "hidden auto",
  boxSizing: "border-box",
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px 14px",
  alignContent: "start",
  minHeight: 0,
};

const hardwareList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  alignContent: "start",
  height: "100%",
};

const fieldLabel: CSSProperties = {
  display: "block",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: dim,
  fontFamily: mono,
  marginBottom: 5,
};

const field: CSSProperties = {
  display: "block",
  width: "100%",
  height: 34,
  boxSizing: "border-box",
  padding: "0 10px",
  fontSize: 13,
  fontFamily: mono,
  color: ink,
  background: fieldGround,
  border: `1px solid ${edge}`,
  borderRadius: 0,
  outline: "none",
  colorScheme: "dark",
};


const fieldRule = `.ccf-field:focus,.ccf-field--open{border-color:${accent} !important;}
.ccf-item{background:transparent;color:${ink};}
.ccf-item:hover{background:${fieldGround};color:${ink};}
.ccf-item--picked,.ccf-item--picked:hover{background:${accent};color:#0E0E0E;}
.ccf-next:hover{filter:brightness(1.08);}
.ccf-back:hover{border-color:${accent};color:${ink};}
.ccf-list{scrollbar-width:thin;scrollbar-color:${edgeLoud} transparent;}
.ccf-list::-webkit-scrollbar{width:6px;}
.ccf-list::-webkit-scrollbar-thumb{background:${edgeLoud};}
.ccf-list::-webkit-scrollbar-track{background:transparent;}
.ccf-range{-webkit-appearance:none;appearance:none;display:block;width:100%;height:22px;margin:0;background:transparent;cursor:pointer;}
.ccf-range:disabled{opacity:.35;cursor:default;}
.ccf-range::-webkit-slider-runnable-track{height:6px;background:linear-gradient(to right, ${accent} var(--p), ${fieldGround} var(--p));border:1px solid ${edge};}
.ccf-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;margin-top:-5px;background:${ink};border:1px solid ${edgeLoud};border-radius:0;}
.ccf-range::-moz-range-track{height:6px;background:${fieldGround};border:1px solid ${edge};}
.ccf-range::-moz-range-progress{height:6px;background:${accent};}
.ccf-range::-moz-range-thumb{width:16px;height:16px;background:${ink};border:1px solid ${edgeLoud};border-radius:0;}
@keyframes ccf-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.ccf-caret{animation:ccf-blink 1.1s steps(1) infinite;}`;


const pickerButton = (filled: boolean): CSSProperties => ({
  display: "block",
  width: "100%",
  height: 34,
  boxSizing: "border-box",
  padding: "0 10px",
  fontSize: 13,
  fontFamily: mono,
  textAlign: "left",
  color: filled ? ink : dim,
  background: fieldGround,
  border: `1px solid ${edge}`,
  borderRadius: 0,
  outline: "none",
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});


const list = (rect: DOMRect, openUp: boolean): CSSProperties => ({
  position: "fixed",
  left: rect.left,
  ...(openUp
    ? { bottom: window.innerHeight - rect.top + 4 }
    : { top: rect.bottom + 4 }),
  width: rect.width,
  maxHeight: 216,
  overflowY: "auto",
  background: listGround,
  border: `1px solid ${edgeLoud}`,
  colorScheme: "dark",
  zIndex: 10,
  boxSizing: "border-box",
});


const item: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "7px 10px",
  fontSize: 12.5,
  fontFamily: mono,
  textAlign: "left",
  border: "none",
  borderRadius: 0,
  outline: "none",
  cursor: "pointer",
};


const rangeHead: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const pill: CSSProperties = {
  flex: "none",
  fontSize: 11.5,
  fontFamily: mono,
  color: ink,
  background: fieldGround,
  border: `1px solid ${edge}`,
  padding: "3px 8px",
};


const machineLine: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  paddingBottom: 8,
  borderBottom: `1px solid ${edge}`,
};

const machineValues: CSSProperties = {
  color: ink,
  fontSize: 11.5,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};


const summaryRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 0",
  borderBottom: `1px solid ${edge}`,
  fontSize: 12.5,
  fontFamily: mono,
};

const summaryKey: CSSProperties = {
  flex: "none",
  color: dim,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const summaryValue: CSSProperties = {
  color: ink,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};


const terminal: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden auto",
  fontFamily: mono,
  fontSize: 12,
  lineHeight: 1.7,
  color: ink,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const caret: CSSProperties = {
  display: "inline-block",
  width: 8,
  height: 14,
  verticalAlign: "text-bottom",
  background: ink,
};


const logColor = (kind: LogLine["kind"]): string =>
  kind === "error" ? "#C47A6D" : kind === "step" ? accent : ink;

const status: CSSProperties = {
  flex: "none",
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderTop: `1px solid ${edge}`,
  paddingTop: 10,
  fontSize: 11,
  fontFamily: mono,
  color: dim,
};

const statusText: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: 1,
  minWidth: 0,
};

const statusClip: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusDot = (bad: boolean): CSSProperties => ({
  width: 6,
  height: 6,
  flex: "none",
  background: bad ? "#C47A6D" : accent,
});


const nextButton: CSSProperties = {
  flex: "none",
  padding: "7px 20px",
  fontSize: 11.5,
  fontFamily: mono,
  letterSpacing: "0.16em",
  color: "#0E0E0E",
  background: white,
  border: `1px solid ${white}`,
  borderRadius: 0,
  outline: "none",
  cursor: "pointer",
};


const backButton: CSSProperties = {
  flex: "none",
  padding: "7px 16px",
  fontSize: 11.5,
  fontFamily: mono,
  letterSpacing: "0.16em",
  color: dim,
  background: "transparent",
  border: `1px solid ${edge}`,
  borderRadius: 0,
  outline: "none",
  cursor: "pointer",
};




function Picker({
  label,
  testId,
  value,
  options,
  onChange,
}: {
  label: string;
  testId: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const opened = useRef<HTMLDivElement>(null);

  
  
  
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wrap.current?.contains(target) || opened.current?.contains(target)) return;
      setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const follow = (event: Event) => {
      const target = event.target as Node;
      if (wrap.current?.contains(target) || opened.current?.contains(target)) return;
      if (button.current) setRect(button.current.getBoundingClientRect());
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open]);

  const toggle = () => {
    if (!open && button.current) setRect(button.current.getBoundingClientRect());
    setOpen((current) => !current);
  };

  const openUp = rect !== null && rect.bottom + 228 > window.innerHeight;

  return (
    <div ref={wrap}>
      <span style={fieldLabel}>{label}</span>
      <button
        ref={button}
        type="button"
        data-testid={testId}
        className={`ccf-field${open ? " ccf-field--open" : ""}`}
        style={pickerButton(value.length > 0)}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length > 0 ? value : "Choose…"}
      </button>
      {open &&
        rect !== null &&
        
        
        createPortal(
          <div ref={opened} className="ccf-list" style={list(rect, openUp)} role="listbox">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                className={`ccf-item${option === value ? " ccf-item--picked" : ""}`}
                style={item}
                
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}function Range({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number | null;
  step: number;
  value: number | null;
  unit: string;
  onChange: (value: number) => void;
}) {
  const known = value !== null && max !== null;
  const top = max ?? min;
  const low = Math.min(min, top);
  const span = Math.max(1, top - low);
  const fill = value !== null && max !== null ? `${((value - low) / span) * 100}%` : "0%";

  return (
    <div>
      <div style={rangeHead}>
        <span style={fieldLabel}>{label}</span>
        <output style={pill}>{value !== null && max !== null ? `${value} ${unit}` : "—"}</output>
      </div>
      <input
        className="ccf-range"
        style={{ "--p": fill } as CSSProperties}
        type="range"
        min={low}
        max={top}
        step={step}
        value={value ?? low}
        aria-label={label}
        disabled={!known}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRow}>
      <span style={summaryKey}>{label}</span>
      <span style={summaryValue}>{value.length > 0 ? value : "—"}</span>
    </div>
  );
}export default function CoreConfig({
  stage,
  log,
  onCreate,
}: {
  stage: "form" | "logs";
  log: LogSink;
  onCreate?: (identity: ComputerIdentity, hardware: ComputerHardware) => void;
}) {
  const [identity, setIdentity] = useState<ComputerIdentity>(() => detectedIdentity());
  const [machine, setMachine] = useState<Hardware>(EMPTY_MACHINE);
  const [hardware, setHardware] = useState<ComputerHardware>(EMPTY_HARDWARE);
  const [touched, setTouched] = useState(false);
  const [page, setPage] = useState(0);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let live = true;
    void readHardware().then((found) => {
      if (!live) return;
      setMachine(found);
      setHardware({
        cpuCores: found.cpuCores,
        ramGb: found.ramGb,
        storageGb: found.storageGb,
        gpuPercent: 0,
      });
    });
    return () => {
      live = false;
    };
  }, []);

  const set = <K extends keyof ComputerIdentity>(key: K, value: ComputerIdentity[K]) => {
    setIdentity((current) => ({ ...current, [key]: value }));
  };

  const choose = <K extends keyof ComputerHardware>(key: K, value: ComputerHardware[K]) => {
    setHardware((current) => ({ ...current, [key]: value }));
  };

  const problem = identityProblem(identity);

  useEffect(() => {
    if (stage !== "logs") return;
    const follow = () => {
      const node = terminalRef.current;
      if (node) node.scrollTop = node.scrollHeight;
      forceRender((tick) => tick + 1);
    };
    follow();
    return log.subscribe(follow);
  }, [stage, log]);

  const zoneList = timezonesFor(identity.country);
  const zoneChoices = zoneList.includes(identity.timezone)
    ? zoneList
    : [identity.timezone, ...zoneList];

  return (
    <div style={stageStyle}>
      <div style={box}>
        <div style={face} onBlur={() => setTouched(true)}>
          <style>{fieldRule}</style>

          {stage === "logs" ? (
            <div
              ref={terminalRef}
              className="ccf-terminal"
              style={terminal}
              aria-label="The log of the making"
            >
              {log.lines().map((line, index) => (
                <div key={`${line.at}-${index}`} style={{ color: logColor(line.kind) }}>
                  {line.text}
                </div>
              ))}
              <span className="ccf-caret" style={caret} aria-hidden="true" />
            </div>
          ) : (
            <>
          <div style={viewport}>
            <div style={pages(page)}>
              
              <div style={aPage}>
                <div style={grid}>
                  <label>
                    <span style={fieldLabel}>Name</span>
                    <input
                      className="ccf-field"
                      style={field}
                      value={identity.name}
                      placeholder="my-computer"
                      autoComplete="off"
                      onChange={(event) => set("name", event.target.value)}
                    />
                  </label>
                  <label>
                    <span style={fieldLabel}>User name</span>
                    <input
                      className="ccf-field"
                      style={field}
                      value={identity.username}
                      placeholder="open-computer"
                      spellCheck={false}
                      autoComplete="username"
                      onChange={(event) => set("username", event.target.value)}
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    <span style={fieldLabel}>Password</span>
                    <input
                      className="ccf-field"
                      style={field}
                      type="password"
                      data-testid="password"
                      value={identity.password}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      onChange={(event) => set("password", event.target.value)}
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    <span style={fieldLabel}>Confirm password</span>
                    <input
                      className="ccf-field"
                      style={field}
                      type="password"
                      data-testid="password-confirm"
                      value={identity.confirmPassword}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      onChange={(event) => set("confirmPassword", event.target.value)}
                    />
                  </label>
                  <Picker
                    label="Country"
                    testId="picker-country"
                    value={identity.country}
                    options={COUNTRIES}
                    onChange={(country) => setIdentity((current) => withCountry(current, country))}
                  />
                  <Picker
                    label="Language"
                    testId="picker-language"
                    value={identity.language}
                    options={LANGUAGES}
                    onChange={(language) => set("language", language)}
                  />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Picker
                      label="Time zone"
                      testId="picker-timezone"
                      value={identity.timezone}
                      options={zoneChoices}
                      onChange={(timezone) => set("timezone", timezone)}
                    />
                  </div>
                </div>
              </div>

              
              <div style={aPage}>
                <div style={hardwareList}>
                  <div style={machineLine}>
                    <span style={summaryKey}>Detected</span>
                    <span style={machineValues}>{printHardware(machine)}</span>
                  </div>
                  <Range
                    label="STORAGE"
                    min={8}
                    max={machine.storageGb}
                    step={8}
                    value={hardware.storageGb}
                    unit="GB"
                    onChange={(storageGb) => choose("storageGb", storageGb)}
                  />
                  <Range
                    label="RAM"
                    min={1}
                    max={machine.ramGb}
                    step={1}
                    value={hardware.ramGb}
                    unit="GB"
                    onChange={(ramGb) => choose("ramGb", ramGb)}
                  />
                  <Range
                    label="CPU CORES"
                    min={1}
                    max={machine.cpuCores}
                    step={1}
                    value={hardware.cpuCores}
                    unit="CORES"
                    onChange={(cpuCores) => choose("cpuCores", cpuCores)}
                  />
                  <Range
                    label="GPU"
                    min={0}
                    max={machine.gpu === null ? null : 100}
                    step={5}
                    value={machine.gpu === null ? null : hardware.gpuPercent}
                    unit="%"
                    onChange={(gpuPercent) => choose("gpuPercent", gpuPercent)}
                  />
                </div>
              </div>

              
              <div style={aPage}>
                <div>
                  <Summary label="Name" value={identity.name.trim()} />
                  <Summary label="User name" value={identity.username} />
                  <Summary label="Country" value={identity.country} />
                  <Summary label="Language" value={identity.language} />
                  <Summary label="Time zone" value={identity.timezone} />
                  <Summary
                    label="CPU cores"
                    value={hardware.cpuCores === null ? "" : `${hardware.cpuCores} CORES`}
                  />
                  <Summary
                    label="RAM"
                    value={hardware.ramGb === null ? "" : `${hardware.ramGb} GB`}
                  />
                  <Summary
                    label="Storage"
                    value={hardware.storageGb === null ? "" : `${hardware.storageGb} GB`}
                  />
                  <Summary
                    label="GPU"
                    value={machine.gpu === null ? "" : `${hardware.gpuPercent}%`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={status} role="status">
            <span style={statusText}>
              <i
                style={statusDot(Boolean(problem) && touched && page !== 1)}
                aria-hidden="true"
              />
              <span style={statusClip}>
                {page === 1
                  ? "Choose the hardware of the computer."
                  : page === 2
                    ? problem === null
                      ? "The summary looks good. Create the computer."
                      : touched
                        ? problem
                        : "Check the summary before creating."
                    : problem === null
                      ? "The identity looks valid. The desktop takes it from here."
                      : touched
                        ? problem
                        : "Fill the fields of the identity."}
              </span>
            </span>
            {page > 0 && (
              <button
                type="button"
                className="ccf-back"
                style={backButton}
                onClick={() => setPage(page - 1)}
              >
                BACK
              </button>
            )}
            <button
              type="button"
              className="ccf-next"
              style={nextButton}
              onClick={() => {
                if (page !== 2) {
                  setPage(page + 1);
                  return;
                }
                if (problem !== null) {
                  setTouched(true);
                  return;
                }
                onCreate?.(identity, hardware);
              }}
            >
              {page === 2 ? "CREATE" : "NEXT"}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
