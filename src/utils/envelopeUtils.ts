export const expandEnvelope = (
  values: unknown,
  length: number,
  defaultValue: number,
): number[] => {
  const rawArray = Array.isArray(values) ? values : [];
  const numericValues = rawArray
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return Array(length).fill(defaultValue);
  }

  const result: number[] = [];
  for (let i = 0; i < length; i += 1) {
    if (i < numericValues.length) {
      result[i] = numericValues[i] as number;
    } else {
      result[i] = numericValues[numericValues.length - 1] as number;
    }
  }
  return result;
};

export const expandLoopingEnvelope = (
  values: unknown,
  length: number,
  defaultValue: number,
): number[] => {
  const rawArray = Array.isArray(values) ? values : [];
  const numericValues = rawArray
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return Array(length).fill(defaultValue);
  }

  const result: number[] = [];
  for (let i = 0; i < length; i += 1) {
    result[i] = numericValues[i % numericValues.length] as number;
  }
  return result;
};

export const trimEnvelope = (values: number[]): number[] => {
  if (!values || values.length === 0) {
    return [];
  }

  const last = values[values.length - 1] as number;
  let index = values.length - 2;

  while (index >= 0 && values[index] === last) {
    index -= 1;
  }

  return values.slice(0, index + 1).concat(last);
};

export const isEnvelopeZeroDefault = (values: number[]): boolean =>
  !values ||
  values.length === 0 ||
  (values.length === 1 && values[0] === 0);
