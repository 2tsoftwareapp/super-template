// @vitest-environment jsdom
/**
 * Smoke tests: every UI primitive renders without crashing.
 * These guard the package against broken internal imports after moves/refactors
 * (web-core is the single source of truth for UI — see the 2026-07-11
 * re-architecture roadmap, P1).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "./alert";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import { ConfirmDialog } from "./confirm-dialog";
import { DatePicker } from "./date-picker";
import { Empty } from "./empty";
import { Input } from "./input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp";
import { Label } from "./label";
import { FullScreenLoading, SectionLoading } from "./loading";
import { Pagination } from "./pagination";
import { PasswordInput } from "./password-input";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Textarea } from "./textarea";
import { Tooltip } from "./tooltip";

describe("web-core UI primitives smoke", () => {
  it("renders Alert", () => {
    render(<Alert>alert body</Alert>);
    expect(screen.getByText("alert body")).toBeInTheDocument();
  });

  it("renders Avatar", () => {
    const { container } = render(<Avatar name="Jane Doe" />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Badge", () => {
    render(<Badge>new</Badge>);
    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("renders Button", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders Calendar", () => {
    const { container } = render(<Calendar />);
    expect(container.querySelector("table, [role='grid']")).not.toBeNull();
  });

  it("renders Card with sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders Checkbox", () => {
    const { container } = render(<Checkbox />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders ConfirmDialog when open", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item?"
        message="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
  });

  it("renders DatePicker", () => {
    const { container } = render(
      <DatePicker value="" onChange={vi.fn()} />,
    );
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("renders Empty", () => {
    render(<Empty title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders Input", () => {
    render(<Input placeholder="type here" />);
    expect(screen.getByPlaceholderText("type here")).toBeInTheDocument();
  });

  it("renders InputOTP", () => {
    const { container } = render(
      <InputOTP maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Label", () => {
    render(<Label htmlFor="x">A label</Label>);
    expect(screen.getByText("A label")).toBeInTheDocument();
  });

  it("renders FullScreenLoading and SectionLoading", () => {
    render(<FullScreenLoading title="Loading things" description="wait" />);
    expect(screen.getByText("Loading things")).toBeInTheDocument();
    render(<SectionLoading />);
  });

  it("renders Pagination", () => {
    render(
      <Pagination
        page={2}
        pageSize={20}
        totalPages={5}
        total={100}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("renders PasswordInput", () => {
    render(<PasswordInput placeholder="secret" />);
    expect(screen.getByPlaceholderText("secret")).toBeInTheDocument();
  });

  it("renders Separator", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Skeleton", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Spinner", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Table", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("renders Textarea", () => {
    render(<Textarea placeholder="notes" />);
    expect(screen.getByPlaceholderText("notes")).toBeInTheDocument();
  });

  it("renders Tooltip convenience API without content", () => {
    render(
      <Tooltip>
        <button type="button">bare trigger</button>
      </Tooltip>,
    );
    expect(screen.getByText("bare trigger")).toBeInTheDocument();
  });

  it("renders Tooltip convenience API with content", () => {
    render(
      <Tooltip content="tip text">
        <button type="button">hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText("hover me")).toBeInTheDocument();
  });
});
