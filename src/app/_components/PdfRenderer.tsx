"use client";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useResizeDetector } from "react-resize-detector";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfRendererProps {
  url: string;
}

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast();

  const [numPages, setNumPages] = useState<number | null>(null);
  const [currPage, setCurrPage] = useState<number>(1);

  const { width, ref } = useResizeDetector();

  const CustomPageValidator = z.object({
    page: z
      .string()
      .refine((val) => Number(val) > 0 && Number(val) <= numPages!),
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;
  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrPage(Number(page));
    setValue("page", String(page));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: { page: "1" },
    resolver: zodResolver(CustomPageValidator),
  });
  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex justify-between items-center px-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            disabled={currPage <= 1}
            aria-label="previous page"
            onClick={() => {
              setCurrPage((prev) => (prev - 1 < 1 ? 1 : prev - 1));
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              className={cn(
                "w-12 h-8",
                errors.page && "focus-visible:ring-red-500"
              )}
              {...register("page")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
            <p className="text-zinc-500 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? "x"}</span>
            </p>
          </div>

          <Button
            disabled={numPages === undefined || currPage === numPages}
            variant="ghost"
            aria-label="next page"
            onClick={() => {
              setCurrPage((prev) =>
                prev + 1 > numPages! ? numPages! : prev + 1
              );
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full max-h-screen">
        <div ref={ref}>
          <Document
            loading={
              <div className="flex justify-center">
                <Loader2 className="my-24 h-6 w-6 animate-spin" />
              </div>
            }
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
            onLoadError={() => {
              toast({
                title: "Error loading PDF",
                description: "Please try again later",
                variant: "destructive",
              });
            }}
            file={url}
            className="max-h-full"
          >
            <Page width={width ? width : 1} pageNumber={currPage} />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfRenderer;
