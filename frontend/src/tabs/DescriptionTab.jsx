 import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { useModal } from "../context/ModalContext";

export default function DescriptionTab({
  listingId,
  initialData = "",
  goNextTab,
}) {
  const editorRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  const { showModal } = useModal();

  // =========================================
  // SET INITIAL DESCRIPTION
  // =========================================

  useEffect(() => {
    if (
      editorReady &&
      editorRef.current &&
      initialData
    ) {
      editorRef.current.setContent(initialData);
    }
  }, [editorReady, initialData]);

  // =========================================
  // SAVE DESCRIPTION
  // =========================================

  const saveDescription = async () => {
    if (!listingId) {
      showModal("Listing not created yet");
      return;
    }

    if (!editorRef.current) {
      showModal("Editor is not ready");
      return;
    }

    try {
      setLoading(true);

      const content =
        editorRef.current.getContent();

      if (!content || content.trim() === "") {
        showModal("Description cannot be empty");
        return;
      }

      await api.put(
        `/listings/${listingId}/description`,
        {
          description: content,
        }
      );

      setTimeout(() => {
        goNextTab();
      }, 500);

    } catch (err) {
      console.error(
        "Description save error:",
        err
      );

      showModal(
        "Failed to save description"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* =====================================
          TINYMCE
      ====================================== */}

      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"

        onInit={(evt, editor) => {
          editorRef.current = editor;
          setEditorReady(true);
        }}

        initialValue={initialData || ""}

        init={{
          height: 350,

          menubar: false,

          license_key: "gpl",

          branding: false,

          promotion: false,

          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "charmap",
            "preview",
            "searchreplace",
            "code",
            "fullscreen",
            "table",
            "wordcount",
          ],

          toolbar:
            "undo redo | " +
            "bold italic underline | " +
            "alignleft aligncenter alignright | " +
            "bullist numlist | " +
            "link | code",

          content_style: `
            body {
              font-family: Quicksand, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              padding: 10px;
            }
          `,
        }}
      />

      {/* =====================================
          SAVE BUTTON
      ====================================== */}

      <button
        type="button"
        onClick={saveDescription}
        disabled={loading || !editorReady}
        className={`
          px-6
          py-2
          rounded
          text-white
          font-medium
          transition-all
          
          ${
            loading || !editorReady
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }
        `}
      >
        {loading
          ? "Saving..."
          : "Save & Continue"}
      </button>

    </div>
  );
}