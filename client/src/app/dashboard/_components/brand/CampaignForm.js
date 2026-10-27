"use client";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";

import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { uploadCampaignCover } from "@/services/campaign.service";
import CampaignCoverUploader from "../shared/CampaignCoverUploader";
import { InlineSpinner } from "@/components/loading-state";

import Link from "next/link";

import { ArrowLeft, Save } from "lucide-react";

export default function CampaignForm({
  initialValues = {},
  title,
  subtitle,
  submitLabel,
  onSubmit,
  isSubmitting = false,
}) {
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const uploadController = useRef(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const [form, setForm] = useState({
    title: initialValues.title || "",

    coverImage: initialValues.coverImage || { url: "", publicId: "" },

    description: initialValues.description || "",

    requirements: initialValues.requirements || "",

    platform: initialValues.platform === "YOUTUBE" ? "YOUTUBE" : "INSTAGRAM",

    contentType:
      initialValues.platform === "YOUTUBE"
        ? ["VIDEO", "SHORT"].includes(initialValues.contentType)
          ? initialValues.contentType
          : "VIDEO"
        : "REEL",

    campaignBudget: initialValues.campaignBudget ?? "",
    rewardRatePerThousandViews: initialValues.rewardRatePerThousandViews ?? "",
    minimumPayout: initialValues.minimumPayout ?? "",
    maximumPayoutPerCreator: initialValues.maximumPayoutPerCreator ?? "",
    creatorSlots: initialValues.creatorSlots ?? "",

    deadline: toDateInput(initialValues.deadline),
  });

  const [originalForm] = useState(() => JSON.stringify(form));
  useUnsavedChanges(JSON.stringify(form) !== originalForm);

  const handleCoverUpload = async (file) => {
    if (!file || isSubmitting || uploadController.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverUploadError("Please upload a JPG, PNG, or WebP image.");
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverUploadError("Image must be 5 MB or smaller.");
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    const controller = new AbortController();
    uploadController.current = controller;
    setIsUploadingCover(true);
    setCoverUploadError("");
    setCoverUploadProgress(0);
    try {
      const response = await uploadCampaignCover(file, {
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (event.total)
            setCoverUploadProgress(
              Math.min(100, Math.round((event.loaded / event.total) * 100)),
            );
        },
      });
      if (!response.data?.coverImage?.url)
        throw new Error("Upload response did not include an image URL.");
      if (!controller.signal.aborted) {
        setForm((current) => ({
          ...current,
          coverImage: response.data.coverImage,
        }));
        toast.success("Campaign cover uploaded.");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to upload campaign image.";
        setCoverUploadError(message);
        toast.error(message);
      }
    } finally {
      uploadController.current = null;
      if (!controller.signal.aborted) setIsUploadingCover(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "platform"
        ? {
            contentType:
              value === "INSTAGRAM"
                ? "REEL"
                : ["VIDEO", "SHORT"].includes(current.contentType)
                  ? current.contentType
                  : "VIDEO",
          }
        : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting || uploadController.current) return;
    if (
      form.title.trim().length < 3 ||
      !form.description.trim() ||
      !form.requirements.trim()
    ) {
      toast.error(
        "Enter a title of at least 3 characters, a description and requirements.",
      );
      return;
    }
    const moneyFields = [
      "campaignBudget",
      "rewardRatePerThousandViews",
      "minimumPayout",
      "maximumPayoutPerCreator",
    ];
    if (
      moneyFields.some(
        (field) =>
          String(form[field]).trim() === "" ||
          !Number.isFinite(Number(form[field])) ||
          Number(form[field]) < (field === "minimumPayout" ? 0 : 1),
      )
    ) {
      toast.error(
        "Enter valid reward settings. Budget, reward rate and maximum payout must be at least 1; minimum payout cannot be negative.",
      );
      return;
    }
    if (Number(form.minimumPayout) > Number(form.maximumPayoutPerCreator)) {
      toast.error("Minimum payout cannot exceed maximum payout per creator.");
      return;
    }
    if (Number(form.maximumPayoutPerCreator) > Number(form.campaignBudget)) {
      toast.error("Maximum payout per creator cannot exceed campaign budget.");
      return;
    }
    if (
      form.creatorSlots !== "" &&
      (!Number.isInteger(Number(form.creatorSlots)) ||
        Number(form.creatorSlots) < 1)
    ) {
      toast.error(
        "Creator slots must be a positive whole number, or left empty.",
      );
      return;
    }
    const deadline =
      form.deadline === toDateInput(initialValues.deadline)
        ? new Date(initialValues.deadline)
        : new Date(`${form.deadline}T23:59:59`);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      toast.error("Choose a future deadline.");
      return;
    }

    onSubmit({
      coverImage: form.coverImage,
      title: form.title.trim(),

      description: form.description.trim(),

      requirements: form.requirements.trim(),

      platform: form.platform,

      contentType: form.contentType,

      campaignBudget: Number(form.campaignBudget),
      rewardRatePerThousandViews: Number(form.rewardRatePerThousandViews),
      minimumPayout: Number(form.minimumPayout),
      maximumPayoutPerCreator: Number(form.maximumPayoutPerCreator),
      creatorSlots: form.creatorSlots ? Number(form.creatorSlots) : null,

      deadline: deadline.toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-2 py-6 lg:px-6">
      <Link
        href="/dashboard/campaigns"
        aria-disabled={isSubmitting || isUploadingCover}
        onClick={(event) => {
          if (isSubmitting || isUploadingCover) event.preventDefault();
        }}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-500"
      >
        <ArrowLeft size={16} />
        Back to campaigns
      </Link>

      <div className="rounded-2xl border border-card-border bg-card-background">
        {/* Header */}

        <div className="border-b border-card-border p-6">
          <h1 className="text-[28px] font-medium tracking-tight text-text-primary">
            {title}
          </h1>

          <p className="mt-2 text-sm text-text-tertiary">{subtitle}</p>
        </div>

        {/* Form */}

        <fieldset disabled={isSubmitting || isUploadingCover}>
          <form onSubmit={handleSubmit} className="space-y-7 p-6">
            <FormSection
              title="Campaign Brief"
              description="Basic information creators will see when discovering the opportunity."
            >
              <Field
                label="Campaign Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Summer Product Reel Campaign"
                required
              />

              <CampaignCoverUploader
                coverImage={form.coverImage}
                onUpload={handleCoverUpload}
                onRemove={() => {
                  setForm((current) => ({
                    ...current,
                    coverImage: { url: "", publicId: "" },
                  }));
                  setCoverUploadError("");
                }}
                isUploading={isUploadingCover}
                disabled={isSubmitting}
                error={coverUploadError}
                progress={coverUploadProgress}
              />

              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the campaign, product and creative direction..."
                rows={6}
                required
              />

              <Textarea
                label="Creator Requirements"
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="Explain deliverable requirements, do's, don'ts, messaging or other guidelines..."
                rows={6}
                required
              />
            </FormSection>

            <FormSection
              title="Deliverable"
              description="Define where the content should be created and what format is required."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Platform"
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  options={[
                    { value: "INSTAGRAM", label: "Instagram" },
                    { value: "YOUTUBE", label: "YouTube" },
                  ]}
                />

                <Select
                  label="Content Type"
                  name="contentType"
                  value={form.contentType}
                  onChange={handleChange}
                  disabled={form.platform === "INSTAGRAM"}
                  options={
                    form.platform === "INSTAGRAM"
                      ? [{ value: "REEL", label: "Reels" }]
                      : [
                          { value: "VIDEO", label: "Video" },
                          { value: "SHORT", label: "Shorts" },
                        ]
                  }
                />
              </div>
            </FormSection>

            <section className="rounded-2xl border border-card-border bg-card-background p-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Reward &amp; Budget
              </h2>
              <p className="mt-1 text-sm text-text-tertiary">
                Configure how creators earn from this campaign.
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <MoneyField
                  label="Campaign Budget"
                  name="campaignBudget"
                  value={form.campaignBudget}
                  onChange={handleChange}
                  helper="Maximum amount available for creator rewards."
                />
                <MoneyField
                  label="Reward Rate"
                  name="rewardRatePerThousandViews"
                  value={form.rewardRatePerThousandViews}
                  onChange={handleChange}
                  suffix="per 1K views"
                  helper="Amount earned for every 1,000 verified views."
                />
                <MoneyField
                  label="Minimum Payout"
                  name="minimumPayout"
                  value={form.minimumPayout}
                  onChange={handleChange}
                  helper="Minimum reward a creator must reach."
                />
                <MoneyField
                  label="Maximum Payout per Creator"
                  name="maximumPayoutPerCreator"
                  value={form.maximumPayoutPerCreator}
                  onChange={handleChange}
                  helper="Maximum reward one creator can earn."
                />
                <div>
                  <Field
                    label="Creator Slots"
                    name="creatorSlots"
                    type="number"
                    min="1"
                    value={form.creatorSlots}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                  <p className="mt-2 text-xs text-text-tertiary">
                    Optional limit on how many creators can be accepted.
                  </p>
                </div>
              </div>
            </section>
            <FormSection
              title="Campaign Terms"
              description="Set the application deadline."
            >
              <Field
                label="Deadline"
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </FormSection>

            {/* Footer */}

            <div className="flex flex-col-reverse gap-3 border-t border-card-border pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/campaigns"
                aria-disabled={isSubmitting || isUploadingCover}
                onClick={(event) => {
                  if (isSubmitting || isUploadingCover) event.preventDefault();
                }}
                className="flex h-11 items-center justify-center rounded-xl border border-card-border px-5 text-sm font-medium text-text-primary hover:bg-background-gray-primary"
              >
                Cancel
              </Link>

              <button
                type="submit"
                aria-busy={isSubmitting || isUploadingCover}
                disabled={isSubmitting || isUploadingCover}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting || isUploadingCover ? (
                  <InlineSpinner />
                ) : (
                  <Save size={16} />
                )}

                {isUploadingCover
                  ? "Uploading image..."
                  : isSubmitting
                    ? "Saving..."
                    : submitLabel}
              </button>
            </div>
          </form>
        </fieldset>
      </div>
    </div>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>

        <p className="mt-1 text-xs text-text-tertiary">{description}</p>
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        type={type}
        maxLength={name === "title" ? 100 : undefined}
        minLength={name === "title" ? 3 : undefined}
        step={name === "creatorSlots" ? "1" : undefined}
        min={min}
        required={required}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows,
  required,
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        required={required}
        rows={rows}
        maxLength={3000}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm leading-6 text-text-primary outline-none focus:border-brand-500"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, disabled = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function MoneyField({ label, name, value, onChange, helper, suffix }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="mt-2 flex h-11 items-center rounded-xl border border-card-border bg-transparent focus-within:border-brand-500">
        <span
          aria-hidden="true"
          className="border-r border-card-border px-3 text-sm text-text-tertiary"
        >
          ₹
        </span>
        <input
          id={name}
          type="number"
          min={name === "minimumPayout" ? "0" : "1"}
          step="0.01"
          name={name}
          value={value}
          onChange={onChange}
          required
          aria-describedby={`${name}-helper`}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-text-primary outline-none"
        />
        {suffix && (
          <span className="pr-3 text-xs text-text-tertiary">{suffix}</span>
        )}
      </div>
      {helper && (
        <p
          id={`${name}-helper`}
          className="mt-2 text-xs leading-5 text-text-tertiary"
        >
          {helper}
        </p>
      )}
    </div>
  );
}
