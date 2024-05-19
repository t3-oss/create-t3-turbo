import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({ schemaOptions: { collection: "posts" } })
export class PostClass extends TimeStamps {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public content!: string;
}

export const Post =
  (mongoose.models.PostClass as
    | ReturnModelType<typeof PostClass>
    | undefined) ?? getModelForClass(PostClass);
