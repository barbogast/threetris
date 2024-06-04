import useAppStore from "../appStore";
import { Settings } from "../types";

type Props = {
  name: keyof Settings;
  min: number;
  max: number;
  step?: number;
  type: "int" | "float";
};
const RangSetting = ({ name, min, max, step, type }: Props) => {
  const value = useAppStore((state) => state.settings[name]);
  const parse = (s: string) => (type === "int" ? parseInt(s) : parseFloat(s));
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    useAppStore.setState((state) => ({
      ...state,
      settings: { ...state.settings, [name]: parse(e.target.value) },
    }));

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <label>{name as string}</label>
      <input
        type="range"
        name={name as string}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
      <input
        name={name as string}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default RangSetting;
