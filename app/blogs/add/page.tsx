/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, type ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  head: z.string().optional(),
  subhead: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  image: z.instanceof(File).nullable(),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  brief: z.string().min(1, "Brief is required"),
  titleImage: z.instanceof(File).nullable(),
  segments: z.array(segmentSchema),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [availableTags, setAvailableTags] = useState<
    { label: string; value: string }[]
  >([]);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      brief: "",
      category: "",
      titleImage: null,
      segments: [],
      tags: [],
    },
  });

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/getdata/tags");
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setAvailableTags(
          data.data.map((tag: { _id: string; tag: string }) => ({
            value: tag._id,
            label: tag.tag,
          }))
        );
      } catch (error) {
        console.error(error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/getdata/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(
          data.data.map((category: { _id: string; category: string }) => ({
            value: category._id,
            label: category.category,
          }))
        );
      } catch (error) {
        console.error(error);
      }
    };
    fetchTags();
    fetchCategories();
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "segments",
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("brief", data.brief);
      formData.append("category", data.category);
      formData.append("tags", JSON.stringify(data.tags));

      if (data.titleImage) {
        formData.append("titleImage", data.titleImage, data.titleImage.name);
      }

      const segments = data.segments.map(({ image, ...rest }) => ({
        ...rest,
        image: image ? image.name : null,
      }));
      formData.append("segments", JSON.stringify(segments));

      data.segments.forEach((segment, index) => {
        if (segment.image) {
          formData.append(`segments[${index}][image]`, segment.image);
        }
      });

      const response = await fetch("/api/blogs/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create blog");
      }

      toast({ title: "Success", description: "Blog created successfully!" });
      form.reset();
      router.push("/blogs");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-nowrap text-3xl font-bold">Add Blog</h1>
        <div className="relative flex space-x-2">
          <MultiSelect
            options={availableTags}
            value={form.watch("tags") ?? []}
            onChange={(selectedTags: string[]) =>
              form.setValue("tags", selectedTags)
            }
            placeholder="Select Tags"
            className="w-full text-sm"
          />
          <div>
            <Select
              onValueChange={(value) => {
                const selectedCategory = categories.find(
                  (cat) => cat.label === value
                );
                if (selectedCategory) {
                  form.setValue("category", selectedCategory.value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.label}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Creating..." : "Create Blog"}
          </Button>
        </div>
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
                name="brief"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter blog brief" />
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
