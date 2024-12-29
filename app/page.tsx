"use client";

import React from "react";
import useFetch from "@/hooks/useFetch";

const Page = () => {
  const { data, error, loading } = useFetch("/api");

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>{data ? "Data fetched successfully!:" : "No data available."}</p>
    </div>
  );
};

export default Page;
