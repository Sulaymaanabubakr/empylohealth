import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import clsx from 'clsx';
import { AlignCenter, AlignLeft, AlignRight, Bold, ImagePlus, Italic, Link2, List, ListOrdered, PlaySquare, Redo2, RemoveFormatting, Type, Underline as UnderlineIcon, Undo2 } from 'lucide-react';
import { uploadCloudinaryAsset } from '../lib/media';
import { Modal } from './Modal';
import { useNotification } from '../contexts/NotificationContext';

type RichContentEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

type FontOption = {
    label: string;
    value: string;
    googleFamily?: string;
};

const FONT_FAMILIES: FontOption[] = [
    { label: 'Inter', value: '"Inter", "DM Sans", sans-serif', googleFamily: 'Inter:wght@400;500;600;700' },
    { label: 'DM Sans', value: '"DM Sans", "Inter", sans-serif', googleFamily: 'DM+Sans:wght@400;500;700' },
    { label: 'Space Grotesk', value: '"Space Grotesk", "Inter", sans-serif', googleFamily: 'Space+Grotesk:wght@300;400;500;600;700' },
    { label: 'Manrope', value: '"Manrope", "Inter", sans-serif', googleFamily: 'Manrope:wght@400;500;600;700' },
    { label: 'Outfit', value: '"Outfit", "Inter", sans-serif', googleFamily: 'Outfit:wght@400;500;600;700' },
    { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", "Inter", sans-serif', googleFamily: 'Plus+Jakarta+Sans:wght@400;500;600;700' },
    { label: 'Work Sans', value: '"Work Sans", "Inter", sans-serif', googleFamily: 'Work+Sans:wght@400;500;600;700' },
    { label: 'IBM Plex Sans', value: '"IBM Plex Sans", "Inter", sans-serif', googleFamily: 'IBM+Plex+Sans:wght@400;500;600;700' },
    { label: 'Nunito Sans', value: '"Nunito Sans", "Inter", sans-serif', googleFamily: 'Nunito+Sans:wght@400;600;700' },
    { label: 'Mulish', value: '"Mulish", "Inter", sans-serif', googleFamily: 'Mulish:wght@400;500;600;700' },
    { label: 'Urbanist', value: '"Urbanist", "Inter", sans-serif', googleFamily: 'Urbanist:wght@400;500;600;700' },
    { label: 'Sora', value: '"Sora", "Inter", sans-serif', googleFamily: 'Sora:wght@400;500;600;700' },
    { label: 'Poppins', value: '"Poppins", "Inter", sans-serif', googleFamily: 'Poppins:wght@400;500;600;700' },
    { label: 'Montserrat', value: '"Montserrat", "Inter", sans-serif', googleFamily: 'Montserrat:wght@400;500;600;700' },
    { label: 'Rubik', value: '"Rubik", "Inter", sans-serif', googleFamily: 'Rubik:wght@400;500;600;700' },
    { label: 'Lato', value: '"Lato", "Inter", sans-serif', googleFamily: 'Lato:wght@400;700' },
    { label: 'Open Sans', value: '"Open Sans", "Inter", sans-serif', googleFamily: 'Open+Sans:wght@400;500;600;700' },
    { label: 'Roboto', value: '"Roboto", "Inter", sans-serif', googleFamily: 'Roboto:wght@400;500;700' },
    { label: 'Noto Sans', value: '"Noto Sans", "Inter", sans-serif', googleFamily: 'Noto+Sans:wght@400;500;600;700' },
    { label: 'Assistant', value: '"Assistant", "Inter", sans-serif', googleFamily: 'Assistant:wght@400;500;600;700' },
    { label: 'Karla', value: '"Karla", "Inter", sans-serif', googleFamily: 'Karla:wght@400;500;600;700' },
    { label: 'Cabin', value: '"Cabin", "Inter", sans-serif', googleFamily: 'Cabin:wght@400;500;600;700' },
    { label: 'Barlow', value: '"Barlow", "Inter", sans-serif', googleFamily: 'Barlow:wght@400;500;600;700' },
    { label: 'Barlow Condensed', value: '"Barlow Condensed", "Inter", sans-serif', googleFamily: 'Barlow+Condensed:wght@400;500;600;700' },
    { label: 'Public Sans', value: '"Public Sans", "Inter", sans-serif', googleFamily: 'Public+Sans:wght@400;500;600;700' },
    { label: 'Epilogue', value: '"Epilogue", "Inter", sans-serif', googleFamily: 'Epilogue:wght@400;500;600;700' },
    { label: 'Lexend', value: '"Lexend", "Inter", sans-serif', googleFamily: 'Lexend:wght@400;500;600;700' },
    { label: 'Figtree', value: '"Figtree", "Inter", sans-serif', googleFamily: 'Figtree:wght@400;500;600;700' },
    { label: 'Onest', value: '"Onest", "Inter", sans-serif', googleFamily: 'Onest:wght@400;500;600;700' },
    { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif', googleFamily: 'Playfair+Display:wght@400;500;600;700' },
    { label: 'Merriweather', value: '"Merriweather", Georgia, serif', googleFamily: 'Merriweather:wght@400;700' },
    { label: 'Lora', value: '"Lora", Georgia, serif', googleFamily: 'Lora:wght@400;500;600;700' },
    { label: 'Libre Baskerville', value: '"Libre Baskerville", Georgia, serif', googleFamily: 'Libre+Baskerville:wght@400;700' },
    { label: 'Source Serif 4', value: '"Source Serif 4", Georgia, serif', googleFamily: 'Source+Serif+4:wght@400;500;600;700' },
    { label: 'IBM Plex Serif', value: '"IBM Plex Serif", Georgia, serif', googleFamily: 'IBM+Plex+Serif:wght@400;500;600;700' },
    { label: 'DM Serif Display', value: '"DM Serif Display", Georgia, serif', googleFamily: 'DM+Serif+Display' },
    { label: 'Cormorant Garamond', value: '"Cormorant Garamond", Georgia, serif', googleFamily: 'Cormorant+Garamond:wght@400;500;600;700' },
    { label: 'Bitter', value: '"Bitter", Georgia, serif', googleFamily: 'Bitter:wght@400;500;600;700' },
    { label: 'Alegreya', value: '"Alegreya", Georgia, serif', googleFamily: 'Alegreya:wght@400;500;700' },
    { label: 'Crimson Text', value: '"Crimson Text", Georgia, serif', googleFamily: 'Crimson+Text:wght@400;600;700' },
    { label: 'Cardo', value: '"Cardo", Georgia, serif', googleFamily: 'Cardo:wght@400;700' },
    { label: 'Vollkorn', value: '"Vollkorn", Georgia, serif', googleFamily: 'Vollkorn:wght@400;500;600;700' },
    { label: 'Domine', value: '"Domine", Georgia, serif', googleFamily: 'Domine:wght@400;500;600;700' },
    { label: 'Cormorant', value: '"Cormorant", Georgia, serif', googleFamily: 'Cormorant:wght@400;500;600;700' },
    { label: 'Fraunces', value: '"Fraunces", Georgia, serif', googleFamily: 'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", "IBM Plex Mono", monospace', googleFamily: 'JetBrains+Mono:wght@400;500;700' },
    { label: 'IBM Plex Mono', value: '"IBM Plex Mono", "JetBrains Mono", monospace', googleFamily: 'IBM+Plex+Mono:wght@400;500;600;700' },
    { label: 'Source Code Pro', value: '"Source Code Pro", "JetBrains Mono", monospace', googleFamily: 'Source+Code+Pro:wght@400;500;600;700' },
    { label: 'Inconsolata', value: '"Inconsolata", "JetBrains Mono", monospace', googleFamily: 'Inconsolata:wght@400;500;600;700' },
    { label: 'Fira Code', value: '"Fira Code", "JetBrains Mono", monospace', googleFamily: 'Fira+Code:wght@400;500;600;700' },
    { label: 'Red Hat Mono', value: '"Red Hat Mono", "JetBrains Mono", monospace', googleFamily: 'Red+Hat+Mono:wght@400;500;600;700' },
    { label: 'Anonymous Pro', value: '"Anonymous Pro", "JetBrains Mono", monospace', googleFamily: 'Anonymous+Pro:wght@400;700' },
    { label: 'Alegreya Sans', value: '"Alegreya Sans", "Inter", sans-serif', googleFamily: 'Alegreya+Sans:wght@400;500;700' },
    { label: 'Archivo', value: '"Archivo", "Inter", sans-serif', googleFamily: 'Archivo:wght@400;500;600;700' },
    { label: 'Chivo', value: '"Chivo", "Inter", sans-serif', googleFamily: 'Chivo:wght@400;500;700' },
    { label: 'Josefin Sans', value: '"Josefin Sans", "Inter", sans-serif', googleFamily: 'Josefin+Sans:wght@400;500;600;700' },
    { label: 'M PLUS 1', value: '"M PLUS 1", "Inter", sans-serif', googleFamily: 'M+PLUS+1:wght@400;500;700' },
    { label: 'Questrial', value: '"Questrial", "Inter", sans-serif', googleFamily: 'Questrial' },
    { label: 'Raleway', value: '"Raleway", "Inter", sans-serif', googleFamily: 'Raleway:wght@400;500;600;700' },
    { label: 'Syne', value: '"Syne", "Inter", sans-serif', googleFamily: 'Syne:wght@400;500;600;700' },
    { label: 'Tinos', value: '"Tinos", Georgia, serif', googleFamily: 'Tinos:wght@400;700' },
    { label: 'System Sans', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' }
];

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const escapeHtml = (value = '') =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const normalizeHtml = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '<p></p>';
    if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
    return trimmed
        .split(/\n{2,}/)
        .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br/>')}</p>`)
        .join('');
};

const FontFamily = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontFamily: {
                default: null,
                parseHTML: (element: HTMLElement) => element.style.fontFamily?.replace(/['"]/g, '') || null,
                renderHTML: (attributes: Record<string, string | null>) => attributes.fontFamily ? { style: `font-family: ${attributes.fontFamily}` } : {}
            }
        };
    }
});

const FontSize = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: (element: HTMLElement) => element.style.fontSize || null,
                renderHTML: (attributes: Record<string, string | null>) => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {}
            }
        };
    }
});

const CloudinaryVideo = Node.create({
    name: 'cloudinaryVideo',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
        return {
            src: { default: null },
            poster: { default: null }
        };
    },
    parseHTML() {
        return [{ tag: 'video[src]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, {
            controls: 'true',
            playsinline: 'true',
            preload: 'metadata',
            style: 'width: 100%; max-width: 100%; border-radius: 20px; background: #0f172a;'
        })];
    },
    addCommands() {
        return {
            setCloudinaryVideo: (attributes: { src: string; poster?: string }) => ({ commands }: { commands: any }) =>
                commands.insertContent({ type: this.name, attrs: attributes })
        } as any;
    }
});

const ToolbarButton = ({
    label,
    active,
    onClick,
    children
}: {
    label: string;
    active?: boolean;
    onClick: () => void;
    children: ReactNode;
}) => (
    <button
        type="button"
        title={label}
        onClick={onClick}
        className={clsx(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors',
            active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        )}
    >
        {children}
    </button>
);

export const RichContentEditor = ({ value, onChange, placeholder = 'Write the resource content...' }: RichContentEditorProps) => {
    const { showNotification } = useNotification();
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkValue, setLinkValue] = useState('');
    const [fontSearch, setFontSearch] = useState('');
    const loadedFontFamiliesRef = useRef<Set<string>>(new Set());

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] }
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                protocols: ['https', 'http', 'mailto']
            }),
            FontFamily,
            FontSize,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Image.configure({
                inline: false,
                allowBase64: false
            }),
            CloudinaryVideo
        ],
        content: normalizeHtml(value),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'rich-editor prose prose-neutral max-w-none min-h-[260px] p-5 focus:outline-none'
            }
        },
        onUpdate: ({ editor: nextEditor }) => {
            onChange(nextEditor.getHTML());
        }
    });

    useEffect(() => {
        if (!editor) return;
        const normalized = normalizeHtml(value);
        if (editor.getHTML() !== normalized) {
            editor.commands.setContent(normalized, { emitUpdate: false });
        }
    }, [editor, value]);

    const promptForLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkValue(previousUrl);
        setLinkModalOpen(true);
    };

    const handleLinkSave = () => {
        if (!editor) return;
        const url = linkValue.trim();
        if (!url) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        setLinkModalOpen(false);
    };

    const ensureGoogleFontLoaded = (font: FontOption) => {
        if (!font.googleFamily) return;
        if (loadedFontFamiliesRef.current.has(font.googleFamily)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
        document.head.appendChild(link);
        loadedFontFamiliesRef.current.add(font.googleFamily);
    };

    const applyFont = (font: FontOption) => {
        ensureGoogleFontLoaded(font);
        editor?.chain().focus().setMark('textStyle', { fontFamily: font.value }).run();
        setFontSearch(font.label);
    };

    const uploadAndInsert = async (file: File, kind: 'image' | 'video') => {
        if (!editor) return;
        if (kind === 'image') setUploadingImage(true);
        if (kind === 'video') setUploadingVideo(true);
        try {
            const result = await uploadCloudinaryAsset(file, kind, 'resources');
            if (kind === 'image') {
                editor.chain().focus().setImage({ src: result.secureUrl, alt: file.name }).run();
            } else {
                (editor.chain().focus() as any).setCloudinaryVideo({ src: result.secureUrl }).run();
            }
        } catch (error) {
            showNotification('error', error instanceof Error ? error.message : 'Upload failed.');
        } finally {
            if (kind === 'image') setUploadingImage(false);
            if (kind === 'video') setUploadingVideo(false);
        }
    };

    const handleFileInput = async (event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'video') => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        await uploadAndInsert(file, kind);
    };

    if (!editor) return null;

    const activeFontFamily = String(editor.getAttributes('textStyle')?.fontFamily || '"Inter", "DM Sans", sans-serif');
    const activeFontSize = String(editor.getAttributes('textStyle')?.fontSize || '16px');
    const activeFontLabel = FONT_FAMILIES.find((font) => font.value === activeFontFamily)?.label || 'Inter';
    const filteredFonts = useMemo(() => {
        const term = fontSearch.trim().toLowerCase();
        if (!term) return FONT_FAMILIES.slice(0, 16);
        return FONT_FAMILIES.filter((font) => font.label.toLowerCase().includes(term)).slice(0, 24);
    }, [fontSearch]);

    useEffect(() => {
        setFontSearch(activeFontLabel);
    }, [activeFontLabel]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[250px]">
                        <input
                            type="text"
                            value={fontSearch}
                            onChange={(event) => setFontSearch(event.target.value)}
                            placeholder="Search Google fonts..."
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            list="rich-editor-font-list"
                        />
                        <datalist id="rich-editor-font-list">
                            {FONT_FAMILIES.map((font) => (
                                <option key={font.label} value={font.label} />
                            ))}
                        </datalist>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const exactMatch = FONT_FAMILIES.find((font) => font.label.toLowerCase() === fontSearch.trim().toLowerCase());
                            if (exactMatch) {
                                applyFont(exactMatch);
                                return;
                            }
                            showNotification('info', 'Choose a font from the Google font suggestions first.');
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Apply font
                    </button>

                    <select
                        value={activeFontSize}
                        onChange={(event) => editor.chain().focus().setMark('textStyle', { fontSize: event.target.value }).run()}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                        {FONT_SIZES.map((fontSize) => (
                            <option key={fontSize} value={fontSize}>{fontSize}</option>
                        ))}
                    </select>

                    <input
                        type="color"
                        title="Text color"
                        defaultValue="#102027"
                        onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
                        className="h-9 w-11 rounded-lg border border-gray-200 bg-white p-1"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {filteredFonts.map((font) => (
                        <button
                            key={font.label}
                            type="button"
                            onClick={() => applyFont(font)}
                            className={clsx(
                                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                font.value === activeFontFamily
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            )}
                            style={{ fontFamily: font.value }}
                        >
                            {font.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                        <UnderlineIcon size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                        <Type size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                        <List size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                        <AlignLeft size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                        <AlignCenter size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                        <AlignRight size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Insert link" active={editor.isActive('link')} onClick={promptForLink}>
                        <Link2 size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Upload image" onClick={() => imageInputRef.current?.click()}>
                        <ImagePlus size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Upload video" onClick={() => videoInputRef.current?.click()}>
                        <PlaySquare size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                        <RemoveFormatting size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
                        <Undo2 size={16} />
                    </ToolbarButton>
                    <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
                        <Redo2 size={16} />
                    </ToolbarButton>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{uploadingImage ? 'Uploading image…' : 'Images supported'}</span>
                    <span>{uploadingVideo ? 'Uploading video…' : 'Videos upload to Cloudinary'}</span>
                    <span>Formatting and colors render in-app.</span>
                </div>
            </div>

            <EditorContent editor={editor} />

            {!editor.getText().trim() && (
                <div className="pointer-events-none px-5 pb-5 -mt-[240px] text-gray-400 text-sm">
                    {placeholder}
                </div>
            )}

            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleFileInput(event, 'image')}
            />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => void handleFileInput(event, 'video')}
            />
            <Modal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                title="Insert link"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                        <input
                            type="url"
                            value={linkValue}
                            onChange={(event) => setLinkValue(event.target.value)}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Leave the field empty to remove the current link.</p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setLinkModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleLinkSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#008f85]"
                        >
                            Save link
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
