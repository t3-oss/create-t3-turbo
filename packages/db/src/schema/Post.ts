import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({
  schemaOptions: {
    id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class PostClass extends TimeStamps {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public content!: string;
}

export const Post = mongoose.models.PostClass ?? getModelForClass(PostClass);
