import { ComponentProps, JSX } from "solid-js";
import hexRgb from "hex-rgb";

type SVGGComponent = (props?: ComponentProps<"image"> & {fill: string}) => SVGGElement;
interface Cache {
  head: {[key: string]: SVGGComponent },
  tail: {[key: string]: SVGGComponent },
}

const cache: Cache = {
  head: {},
  tail: {},
};

const cleanName = (name: string) => name.replace(/^bwc-/, "").replace(/^shac-/, "");

export async function fetchSVG(type: "head" | "tail", name: string): Promise<SVGGComponent> {
  name = cleanName(name);
  if (cache[type][name]) {
    return cache[type][name];
  }

  const svgComponent = await fetch(`assets/${type}s/${name}.png`)
    .then(res => {
      if (res.ok) {
        return res.blob();
      } else {
        return fetch(`assets/${type}s/default.png`).then(res => res.blob());
      }
    })
    .then(blob => {
      const imgsrc = URL.createObjectURL(blob);

      return (props: ComponentProps<"image"> & {fill: string}): SVGGElement => {
        return <g>
          <ColorFilter color={props.fill} />
          <image
            filter={`url(#${filterIdForColor(props.fill)}`}
            xlink:href={imgsrc}
            {...props}
          />
        </g> as SVGGElement;
      };
    });

  cache[type][name] = svgComponent;
  return svgComponent;
}

function filterIdForColor(color: string): string {
  const rgb = hexRgb(color);
  return "color" + rgb.red.toString(16).padStart(2, "0") + rgb.green.toString(16).padStart(2, "0") + rgb.blue.toString(16).padStart(2, "0");
}

function ColorFilter(props: {color: string}): JSX.Element {
  const rgb = hexRgb(props.color);
  const id = filterIdForColor(props.color);
  return (
    <filter id={id}>
      <feColorMatrix  color-interpolation-filters="sRGB"
        type="matrix"
        result="colormatrix"
        values={`0 0 0 0 ${rgb.red / 255}
                 0 0 0 0 ${rgb.green / 255}
                 0 0 0 0 ${rgb.blue / 255}
                 0 0 0 1 0`} />
    </filter>
  );
}
