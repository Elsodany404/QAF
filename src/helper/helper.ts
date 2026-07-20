export function getOptionValues(optionName: string, data: any) {
  return data?.find((op: any) => op.name === optionName)?.OptionValues;
}
