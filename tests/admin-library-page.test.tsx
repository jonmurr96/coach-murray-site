import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LibraryPage } from "@/pages/admin/AdminDashboard";

afterEach(cleanup);

describe("Coach OS resource library page", () => {
  it("renders searchable resources and disables preview assignments", () => {
    render(<LibraryPage preview />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Library" })
    ).toBeInTheDocument();
    expect(screen.getByText("5-Day Cutting Blueprint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New resource" })).toBeVisible();
    for (const assignment of screen.getAllByRole("checkbox")) {
      expect(assignment).toBeDisabled();
    }
  });

  it("loads the selected resource into the accessible edit form", () => {
    render(<LibraryPage preview />);

    fireEvent.click(
      screen.getByRole("button", { name: "Edit 5-Day Cutting Blueprint" })
    );
    expect(screen.getByLabelText("Resource title")).toHaveValue(
      "5-Day Cutting Blueprint"
    );
    expect(screen.getByLabelText("Resource kind")).toHaveValue("guide");
    expect(screen.getByLabelText(/^Resource URL/)).toHaveValue(
      "/5-day-cutting-blueprint.pdf"
    );
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
