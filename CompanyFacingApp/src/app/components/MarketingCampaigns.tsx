import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Megaphone, RefreshCw, Send, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import {
  fetchMarketingCampaign,
  fetchMarketingCampaigns,
  fetchMarketingTagOptions,
  sendMarketingCampaign,
  upsertMarketingCampaign,
  type MarketingCampaignUpsert,
} from "../services/api";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(text: string) {
  const blocks = text
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return "";
  }

  return blocks
    .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

const DEFAULT_CAMPAIGN: MarketingCampaignUpsert = {
  id: "",
  title: "",
  subject: "",
  tags: [],
  messageText: "",
  messageHtml: "",
  posterUrl: "",
};

export function MarketingCampaigns(props: { token: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ slug: string; name: string }>>([]);
  const [flavorOptions, setFlavorOptions] = useState<string[]>([]);

  const [form, setForm] = useState<MarketingCampaignUpsert>({ ...DEFAULT_CAMPAIGN });
  const [customTag, setCustomTag] = useState("");
  const [lookbackDays, setLookbackDays] = useState(90);
  const [limit, setLimit] = useState(200);

  const [preview, setPreview] = useState<{
    matched: number;
    selected: number;
    recipients: Array<{ id: string; email: string | null; fullName: string }>;
  } | null>(null);

  function resetForm() {
    setForm({ ...DEFAULT_CAMPAIGN });
    setCustomTag("");
    setLookbackDays(90);
    setLimit(200);
    setPreview(null);
    setError("");
    setSuccess("");
  }

  const canSubmit = useMemo(() => {
    return (
      form.id.trim().length > 0 &&
      form.title.trim().length > 0 &&
      form.subject.trim().length > 0 &&
      form.messageText.trim().length > 0
    );
  }, [form.id, form.messageText, form.subject, form.title]);

  async function reload() {
    if (!props.token) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const [campaignsResponse, tagsResponse] = await Promise.all([
        fetchMarketingCampaigns(props.token),
        fetchMarketingTagOptions(props.token),
      ]);

      setCampaigns(campaignsResponse.campaigns.map((c) => ({ id: c.id, title: c.title })));
      setCategoryOptions(tagsResponse.categories);
      setFlavorOptions(tagsResponse.flavorTags);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load marketing data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.token]);

  async function loadCampaignById(id: string) {
    if (!id) return;
    setIsWorking(true);
    setError("");
    setSuccess("");
    setPreview(null);
    try {
      const response = await fetchMarketingCampaign(props.token, id);
      setForm({
        id: response.campaign.id,
        title: response.campaign.title,
        subject: response.campaign.subject,
        tags: response.campaign.tags ?? [],
        messageText: response.campaign.messageText,
        messageHtml: response.campaign.messageHtml,
        posterUrl: response.campaign.posterUrl ?? "",
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load campaign");
    } finally {
      setIsWorking(false);
    }
  }

  function setField<K extends keyof MarketingCampaignUpsert>(key: K, value: MarketingCampaignUpsert[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccess("");
    setError("");
  }

  function addCustomTag() {
    const nextTag = customTag.trim();
    if (!nextTag) return;

    setForm((current) => {
      const next = new Set(current.tags);
      next.add(nextTag);
      return { ...current, tags: Array.from(next.values()).sort((a, b) => a.localeCompare(b)) };
    });
    setCustomTag("");
  }

  async function saveCampaign() {
    setIsWorking(true);
    setError("");
    setSuccess("");
    setPreview(null);

    try {
      const messageHtml = form.messageHtml.trim().length > 0 ? form.messageHtml : textToHtml(form.messageText);
      if (!messageHtml) {
        throw new Error("Message HTML is empty (add HTML or provide a message text).");
      }

      await upsertMarketingCampaign(props.token, {
        ...form,
        id: form.id.trim(),
        title: form.title.trim(),
        subject: form.subject.trim(),
        messageText: form.messageText,
        messageHtml,
        tags: (form.tags ?? []).map((t) => t.trim()).filter(Boolean),
        posterUrl: form.posterUrl?.trim() ? form.posterUrl.trim() : undefined,
      });

      setSuccess(`Saved campaign "${form.id.trim()}".`);
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save campaign");
    } finally {
      setIsWorking(false);
    }
  }

  async function previewRecipients() {
    if (!canSubmit) return;
    setIsWorking(true);
    setError("");
    setSuccess("");
    setPreview(null);

    try {
      const messageHtml = form.messageHtml.trim().length > 0 ? form.messageHtml : textToHtml(form.messageText);
      if (!messageHtml) {
        throw new Error("Message HTML is empty (add HTML or provide a message text).");
      }

      const id = form.id.trim();
      await upsertMarketingCampaign(props.token, {
        ...form,
        id,
        title: form.title.trim(),
        subject: form.subject.trim(),
        messageText: form.messageText,
        messageHtml,
        tags: (form.tags ?? []).map((t) => t.trim()).filter(Boolean),
        posterUrl: form.posterUrl?.trim() ? form.posterUrl.trim() : undefined,
      });

      const response = await sendMarketingCampaign(props.token, id, {
        dryRun: true,
        lookbackDays,
        limit,
      });

      if (!("dryRun" in response) || response.dryRun !== true) {
        throw new Error("Unexpected response from preview");
      }

      setPreview({
        matched: response.matched,
        selected: response.selected,
        recipients: response.recipients,
      });
      setSuccess(`Preview ready: ${response.selected} selected (matched: ${response.matched}).`);
      await reload();
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Failed to preview recipients");
    } finally {
      setIsWorking(false);
    }
  }

  async function sendNow() {
    if (!canSubmit) return;
    setIsWorking(true);
    setError("");
    setSuccess("");

    try {
      const messageHtml = form.messageHtml.trim().length > 0 ? form.messageHtml : textToHtml(form.messageText);
      if (!messageHtml) {
        throw new Error("Message HTML is empty (add HTML or provide a message text).");
      }

      const id = form.id.trim();
      await upsertMarketingCampaign(props.token, {
        ...form,
        id,
        title: form.title.trim(),
        subject: form.subject.trim(),
        messageText: form.messageText,
        messageHtml,
        tags: (form.tags ?? []).map((t) => t.trim()).filter(Boolean),
        posterUrl: form.posterUrl?.trim() ? form.posterUrl.trim() : undefined,
      });

      const response = await sendMarketingCampaign(props.token, id, {
        dryRun: false,
        lookbackDays,
        limit,
      });

      if ("dryRun" in response) {
        throw new Error("Unexpected response from send");
      }

      setSuccess(`Sent ${response.sent}/${response.attempted} emails (matched: ${response.matched}).`);
      setPreview(null);
      await reload();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send campaign");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Marketing</h2>
        </div>
        <Button type="button" variant="outline" onClick={reload} disabled={isLoading || isWorking}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="bg-red-950/40 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Marketing error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="bg-emerald-950/30 border-emerald-700 text-emerald-100">
          <Users className="h-4 w-4" />
          <AlertTitle>Status</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between flex-wrap gap-2">
              Campaign Builder
              {isLoading ? (
                <span className="text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Load existing</Label>
                <select
                  className="h-9 w-full rounded-md border border-slate-700 bg-slate-950/30 px-3 text-sm text-slate-200"
                  value=""
                  onChange={(event) => void loadCampaignById(event.target.value)}
                  disabled={isLoading || isWorking || campaigns.length === 0}
                >
                  <option value="" disabled>
                    {campaigns.length === 0 ? "No campaigns yet" : "Select a campaign..."}
                  </option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Campaign ID</Label>
                <Input
                  value={form.id}
                  onChange={(event) => setField("id", event.target.value)}
                  placeholder="e.g. spring-special"
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                />
                <div className="text-xs text-slate-400">Use only letters, numbers, "-" and "_".</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Title</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Campaign title"
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(event) => setField("subject", event.target.value)}
                  placeholder="Email subject"
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Poster URL (optional)</Label>
              <Input
                value={form.posterUrl ?? ""}
                onChange={(event) => setField("posterUrl", event.target.value)}
                placeholder="https://..."
                className="bg-slate-950/30 border-slate-700 text-slate-200"
                disabled={isWorking}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Tags</Label>
              <select
                multiple
                size={12}
                className="w-full rounded-md border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-200"
                value={form.tags ?? []}
                onChange={(event) => {
                  const selected = Array.from(event.currentTarget.selectedOptions).map((option) => option.value);
                  setField("tags", selected);
                }}
                disabled={isLoading || isWorking}
              >
                <optgroup label="Audience">
                  <option value="audience:all">All customers</option>
                </optgroup>
                <optgroup label="Categories">
                  {categoryOptions.map((category) => (
                    <option key={category.slug} value={`category:${category.slug}`}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Flavour profile">
                  {flavorOptions.map((flavor) => (
                    <option key={flavor} value={`flavor:${flavor}`}>
                      {flavor}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="flex items-center gap-2">
                <Input
                  value={customTag}
                  onChange={(event) => setCustomTag(event.target.value)}
                  placeholder="Optional: add a custom tag (advanced)"
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCustomTag} disabled={isWorking || !customTag.trim()}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.tags ?? []).slice(0, 12).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              {(form.tags ?? []).length > 12 ? <Badge variant="secondary">+{(form.tags ?? []).length - 12}</Badge> : null}
              </div>
              <div className="text-xs text-slate-400">
                Pick <span className="text-slate-200">All customers</span>, categories, or flavour tags like <span className="text-slate-200">flavor:spicy</span>. (Empty tags also sends to all customers.)
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Message Text</Label>
              <Textarea
                value={form.messageText}
                onChange={(event) => setField("messageText", event.target.value)}
                placeholder="Hi {{name}},\n\nYour message here..."
                className="min-h-[160px] bg-slate-950/30 border-slate-700 text-slate-200"
                disabled={isWorking}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Message HTML (optional)</Label>
              <Textarea
                value={form.messageHtml}
                onChange={(event) => setField("messageHtml", event.target.value)}
                placeholder="Leave empty to auto-generate from Message Text."
                className="min-h-[160px] bg-slate-950/30 border-slate-700 text-slate-200 font-mono text-xs"
                disabled={isWorking}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Lookback days</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={lookbackDays}
                  onChange={(event) => setLookbackDays(Number(event.target.value))}
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Max recipients</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="bg-slate-950/30 border-slate-700 text-slate-200"
                  disabled={isWorking}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={saveCampaign} disabled={isWorking || !canSubmit}>
                {isWorking ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isWorking}>
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={previewRecipients} disabled={isWorking || !canSubmit}>
                <Users className="size-4" />
                Preview recipients
              </Button>
              <Button type="button" onClick={sendNow} disabled={isWorking || !canSubmit} className="bg-cyan-600 hover:bg-cyan-500">
                <Send className="size-4" />
                Send campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recipient Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!preview ? (
              <div className="text-slate-400 text-sm">
                Click <span className="text-slate-200">Preview recipients</span> to see who will receive this campaign.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">Matched: {preview.matched}</Badge>
                  <Badge variant="secondary">Selected: {preview.selected}</Badge>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
                  {preview.recipients.slice(0, 120).map((recipient) => (
                    <div
                      key={recipient.id}
                      className="rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-200 font-medium truncate">{recipient.fullName}</div>
                        <div className="text-xs text-slate-400 truncate">{recipient.email ?? "No email"}</div>
                      </div>
                      <div className="text-xs text-slate-500 shrink-0">{recipient.id}</div>
                    </div>
                  ))}
                  {preview.recipients.length > 120 ? (
                    <div className="text-xs text-slate-500">
                      Showing 120 of {preview.recipients.length} recipients.
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
