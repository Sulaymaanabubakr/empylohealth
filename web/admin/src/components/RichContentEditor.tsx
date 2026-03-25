import { useEffect, useRef, useState } from 'react';
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

type RichContentEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

const FONT_FAMILIES = [
    { label: 'DM Sans', value: 'DMSans_400Regular' },
    { label: 'Space Grotesk', value: 'SpaceGrotesk_400Regular' },
    { label: 'System Sans', value: 'System' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'monospace' }
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
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

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
        const url = window.prompt('Enter a URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
            window.alert(error instanceof Error ? error.message : 'Upload failed.');
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

    const activeFontFamily = String(editor.getAttributes('textStyle')?.fontFamily || 'DMSans_400Regular');
    const activeFontSize = String(editor.getAttributes('textStyle')?.fontSize || '16px');

    return (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={activeFontFamily}
                        onChange={(event) => editor.chain().focus().setMark('textStyle', { fontFamily: event.target.value }).run()}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                        {FONT_FAMILIES.map((font) => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                    </select>

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
        </div>
    );
};
