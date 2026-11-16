import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type AnimationConfig,
} from "@zealakit/overlay-react";
import "./arrow-animation-examples.css";

type Direction = NonNullable<AnimationConfig["direction"]>;
type Easing = "ease-in-out" | "linear";
type Kind = "fade" | "expand" | "custom";

// Custom animation: grow from the anchor with a small overshoot.
const customAnimation: NonNullable<AnimationConfig["custom"]> = {
  enter: (context) => [
    { opacity: 0, scale: "0.6", transformOrigin: context.transformOrigin },
    {
      opacity: 1,
      scale: "1.06",
      offset: 0.7,
      transformOrigin: context.transformOrigin,
    },
    { opacity: 1, scale: "1", transformOrigin: context.transformOrigin },
  ],
};

export function ArrowAnimationExamplesContent() {
  const [arrow, setArrow] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [kind, setKind] = useState<Kind>("fade");
  const [direction, setDirection] = useState<Direction>("auto");
  const [easing, setEasing] = useState<Easing>("ease-in-out");
  const [duration, setDuration] = useState(200);

  const config: AnimationConfig | false = animate
    ? {
        type: kind,
        direction,
        easing,
        duration,
        ...(kind === "custom" ? { custom: customAnimation } : {}),
      }
    : false;

  return (
    <section className="example-card">
      <h2>Arrow and animation</h2>
      <p className="example-description">
        Both are opt-in. Toggle them and change the type, direction or timing.
        For expand, direction is the growth direction.
      </p>
      <div className="aa-controls">
        <label>
          <input
            type="checkbox"
            checked={arrow}
            onChange={(event) => setArrow(event.target.checked)}
          />
          Arrow
        </label>
        <label>
          <input
            type="checkbox"
            checked={animate}
            onChange={(event) => setAnimate(event.target.checked)}
          />
          Animation
        </label>
        <label>
          Type
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as Kind)}
          >
            <option>fade</option>
            <option>expand</option>
            <option>custom</option>
          </select>
        </label>
        <label>
          Direction
          <select
            value={direction}
            onChange={(event) => setDirection(event.target.value as Direction)}
          >
            {["auto", "up", "down", "left", "right"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Easing
          <select
            value={easing}
            onChange={(event) => setEasing(event.target.value as Easing)}
          >
            <option>ease-in-out</option>
            <option>linear</option>
          </select>
        </label>
        <label>
          Duration {duration}ms
          <input
            type="range"
            min={0}
            max={800}
            step={20}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="example-body">
        <Popover>
          <PopoverTrigger>Popover</PopoverTrigger>
          <PopoverContent
            className="aa-panel"
            side="bottom"
            sideOffset={14}
            arrow={arrow}
            arrowSize={14}
            animation={config}
          >
            Arrow follows the panel. Close it to see the exit run in reverse.
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger>Tooltip</TooltipTrigger>
          <TooltipContent
            className="aa-panel"
            side="top"
            sideOffset={12}
            arrow={arrow}
            arrowSize={11}
            animation={config}
          >
            Tooltip
          </TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}
