import { DataItem, ProductQuery } from "@/types/customTypes";

export function constructData(data: ProductQuery): DataItem {
  const { options, ...product } = data;
  const transformedOption = options.map(({ OptionValues: values, ...rest }) => {
    const defaultValue = values.filter((v) => v.default)[0];
    return {
      ...rest,
      values,
      defaultValue,
    };
  });
  return { product, options: transformedOption };
}
