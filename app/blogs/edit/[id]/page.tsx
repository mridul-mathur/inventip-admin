"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card } from "../../../../components/ui/card";
import { Textarea } from "../../../../components/ui/textarea";
import { Plus, Trash } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Segment {
  heading: string;
  subheading: string;
  content: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface Blog {
  id: string;
  title: string;
  brief: string;
  category: string;
  titleImageFile: File | null;
  titleImagePreview: string | null;
  segments: Segment[];
  tags: string[];
}

const EditBlogPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [availableTags, setAvailableTags] = useState<
    { label: string; value: string }[]
  >([]);

  const [blog, setBlog] = useState<Blog>({
    id: "",
    title: "",
    brief: "",
    category: "",
    titleImageFile: null,
    titleImagePreview: null,
    segments: [],
    tags: [],
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
    const fetchBlog = async () => {
      if (!id) {
        setErrorMessage("Blog ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/blogs/edit?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setBlog({
            id,
            tags: data.tags || [],
            title: data.title || "",
            brief: data.brief || "",
            category: data.category || "",
            titleImageFile: null,
            titleImagePreview: data.title_image || null,
            segments: (data.segments || []).map((segment: any) => ({
              heading: segment.head || "",
              subheading: segment.subhead || "",
              content: segment.content || "",
              imageFile: null,
              imagePreview: segment.seg_img || null,
            })),
          });
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.error || "Failed to fetch blog data.");
        }
      } catch (error) {
        setErrorMessage("Error fetching blog data.");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
    fetchTags();
    fetchCategories();
  }, [id]);

  const handleSegmentChange = (
    index: number,
    field: keyof Segment,
    value: string | File | null
  ) => {
    const updatedSegments = [...blog.segments];
    if (field === "imageFile" && value instanceof File) {
      if (updatedSegments[index].imagePreview) {
        URL.revokeObjectURL(updatedSegments[index].imagePreview);
      }
      updatedSegments[index].imageFile = value;
      updatedSegments[index].imagePreview = URL.createObjectURL(value);
    } else if (field !== "imageFile") {
      updatedSegments[index][field] = value as string;
    }
    setBlog({ ...blog, segments: updatedSegments });
  };

  const addSegment = () => {
    setBlog((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          heading: "",
          subheading: "",
          content: "",
          imageFile: null,
          imagePreview: null,
        },
      ],
    }));
  };

  const removeSegment = (index: number) => {
    const updatedSegments = blog.segments.filter((_, i) => i !== index);
    setBlog({ ...blog, segments: updatedSegments });
  };

  const handleUpdateBlog = async () => {
    if (!blog.title.trim() || !blog.brief.trim()) {
      setErrorMessage("Title and Brief are required.");
      return;
    }

    for (const segment of blog.segments) {
      if (!segment.content.trim()) {
        setErrorMessage("Each segment must have a heading and content.");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("id", blog.id);
      formData.append("title", blog.title);
      formData.append("brief", blog.brief);
      formData.append("category", blog.category);
      blog.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
      if (blog.titleImageFile) {
        formData.append("titleImage", blog.titleImageFile);
      }

      blog.segments.forEach((segment, index) => {
        formData.append(`segments[${index}][heading]`, segment.heading);
        formData.append(`segments[${index}][subheading]`, segment.subheading);
        formData.append(`segments[${index}][content]`, segment.content);
        if (segment.imageFile) {
          formData.append(`segments[${index}][image]`, segment.imageFile);
        }
      });

      setLoading(true);
      const response = await fetch(`/api/blogs/edit`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        router.push("/blogs");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Failed to update blog.");
      }
    } catch (error) {
      setErrorMessage("Error updating blog.");
      console.error("Error updating blog:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <p>Loading...</p>;
  }
  if (errorMessage) {
    return (
      <div className="p-6">
        <p className="text-red-500">{errorMessage}</p>
        <Button onClick={() => router.push("/blogs")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Blog</h1>
        <div className="relative flex space-x-2">
          <MultiSelect
            options={availableTags}
            value={blog.tags}
            onChange={(selectedTags: string[]) =>
              setBlog({ ...blog, tags: selectedTags })
            }
            placeholder="Select Tags"
            className="w-full text-sm"
          />
          <div>
            <Select
              value={
                categories.find((cat) => cat.value === blog.category)?.label
              }
              onValueChange={(value) => {
                const selectedCategory = categories.find(
                  (cat) => cat.label === value
                );
                if (selectedCategory) {
                  setBlog({ ...blog, category: selectedCategory.value });
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
            className="font-bold"
            size="default"
            onClick={handleUpdateBlog}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Blog"}
          </Button>
        </div>
      </div>
      <Card className="p-6 mb-6 space-y-4">
        <Input
          required
          placeholder="Enter Blog Title"
          className="text-2xl font-bold"
          value={blog.title}
          onChange={(e) => setBlog({ ...blog, title: e.target.value })}
        />
        <Textarea
          required
          placeholder="Enter Blog Brief"
          value={blog.brief}
          onChange={(e) => setBlog({ ...blog, brief: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-2">Title Image</label>
          <Input
            required
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                setBlog({
                  ...blog,
                  titleImageFile: file,
                  titleImagePreview: URL.createObjectURL(file),
                });
              }
            }}
          />
          {blog.titleImagePreview && (
            <img
              src={blog.titleImagePreview}
              alt="Title"
              className="mt-4 h-40 object-cover rounded-md"
            />
          )}
        </div>
      </Card>

      <div className="space-y-6">
        {blog.segments.map((segment, index) => (
          <Card key={index} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Segment {index + 1}</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSegment(index)}
              >
                <Trash />
              </Button>
            </div>
            <Input
              placeholder="Segment Heading"
              value={segment.heading}
              onChange={(e) =>
                handleSegmentChange(index, "heading", e.target.value)
              }
            />
            <Input
              placeholder="Segment Subheading"
              value={segment.subheading}
              onChange={(e) =>
                handleSegmentChange(index, "subheading", e.target.value)
              }
            />
            <Textarea
              placeholder="Segment Content"
              value={segment.content}
              onChange={(e) =>
                handleSegmentChange(index, "content", e.target.value)
              }
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSegmentChange(index, "imageFile", e.target.files[0]);
                }
              }}
            />
            {segment.imagePreview && (
              <img
                src={segment.imagePreview}
                alt={`Segment ${index + 1}`}
                className="mt-4 h-32 object-cover rounded-md"
              />
            )}
          </Card>
        ))}
        <Button
          variant="secondary"
          size="default"
          onClick={addSegment}
          className="flex items-center space-x-2"
        >
          <Plus />
          <span>Add Segment</span>
        </Button>
      </div>
    </div>
  );
};

export default EditBlogPage;
