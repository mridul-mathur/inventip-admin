/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const segmentSchema = z.object({
  head: z.string().min(1, "Heading is required"),
  subhead: z.string(),
  content: z.string().min(1, "Content is required"),
  image: z.instanceof(File).nullable(),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  titleImage: z.instanceof(File).nullable(),
  segments: z.array(segmentSchema),
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      titleImage: null,
      segments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "segments",
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("title", data.title);
      if (data.titleImage) {
        console.log("Title Image Name:", data.titleImage.name); // Debugging
        formData.append(
          "titleImage",
          data.titleImage,
          data.titleImage.name || "file"
        );
      }

      const segmentsWithoutFiles = data.segments.map(
        ({ image, ...rest }) => rest
      );
      formData.append("segments", JSON.stringify(segmentsWithoutFiles));

      data.segments.forEach((segment, index) => {
        if (segment.image) {
          console.log(`Segment ${index} Image Name:`, segment.image.name); // Debugging
          formData.append(
            `segments[${index}][image]`,
            segment.image,
            segment.image.name || "file"
          );
        }
      });

      console.log("Form Data Sent:", formData); // Debugging

      const response = await fetch("/api/blogs/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create blog");
      }

      toast({
        title: "Success",
        description: "Blog created successfully!",
      });
      router.push("/blogs");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create blog",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add Blog</h1>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? "Creating..." : "Create Blog"}
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Blog Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter blog title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titleImage"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Title Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0] ?? null;
                          onChange(file);
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="text-lg font-semibold">Segment {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`segments.${index}.head`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heading</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter heading" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`segments.${index}.subhead`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subheading</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter subheading" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`segments.${index}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter content"
                            className="min-h-[150px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`segments.${index}.image`}
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0] ?? null;
                              onChange(file);
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  head: "",
                  subhead: "",
                  content: "",
                  image: null,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Segment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
