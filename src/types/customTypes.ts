import type { Option, OptionValue } from "./db";

export type optionWithValue = Option & {
  OptionValues: OptionValue[];
};
