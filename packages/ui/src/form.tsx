"use client";

import type { LabelProps } from "@radix-ui/react-label";
import type { SlotProps } from "@radix-ui/react-slot";
import type { ComponentProps } from "react";
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormProps,
} from "react-hook-form";
import type { ZodType, ZodTypeDef } from "zod";
import { createContext, use, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slot } from "@radix-ui/react-slot";
import {
  useForm as __useForm,
  Controller,
  useFormContext,
} from "react-hook-form";

import { cn } from "@acme/ui";

import { Label } from "./label";

function useForm<
  TOut extends FieldValues,
  TDef extends ZodTypeDef,
  TIn extends FieldValues,
>(
  props: Omit<UseFormProps<TIn>, "resolver"> & {
    schema: ZodType<TOut, TDef, TIn>;
  },
) {
  const form = __useForm<TIn, unknown, TOut>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const { getFieldState, formState } = useFormContext();

  const fieldContext = use(FormFieldContext);
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const fieldState = getFieldState(fieldContext.name, formState);

  const itemContext = use(FormItemContext);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

interface FormItemContextValue {
  id: string;
}

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: ComponentProps<"div">) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: LabelProps) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      htmlFor={formItemId}
      className={cn(error && "text-destructive", className)}
      {...props}
    />
  );
}

function FormControl({ ...props }: SlotProps) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormMessage({ className, children, ...props }: ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message) : children;

  if (!body) {
    return;
  }

  return (
    <p
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useForm,
  useFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};

export { FormProvider as Form, useFieldArray } from "react-hook-form";
