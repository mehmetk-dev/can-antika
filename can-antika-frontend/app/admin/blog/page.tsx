"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { PenTool, Plus, Pencil, Trash2, Loader2, Eye, FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { blogApi, fileApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { formatDateTR } from "@/lib/utils"

interface BlogPost { id: number; title: string; slug: string; content: string; summary: string; imageUrl: string; categoryId: number; author: string; published: boolean; createdAt: string }
interface BlogCategory { id: number; name: string; slug: string; active: boolean }

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [categories, setCategories] = useState<BlogCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<"posts" | "categories">("posts")
    const [showPostForm, setShowPostForm] = useState(false)
    const [showCatForm, setShowCatForm] = useState(false)
    const [editPost, setEditPost] = useState<BlogPost | null>(null)
    const [editCat, setEditCat] = useState<BlogCategory | null>(null)
    const [postForm, setPostForm] = useState({ title: "", slug: "", content: "", summary: "", imageUrl: "", categoryId: 0, author: "", published: false })
    const [catForm, setCatForm] = useState({ name: "", slug: "", active: true })
    const [uploadingImage, setUploadingImage] = useState(false)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        try {
            const [p, c] = await Promise.all([blogApi.adminGetPosts(0, 100), blogApi.adminGetCategories()])
            setPosts(p.items || [])
            setCategories(c)
        } catch { toast.error("YÃ¼klenemedi") }
        finally { setLoading(false) }
    }

    // Posts
    const openCreatePost = () => { setEditPost(null); setPostForm({ title: "", slug: "", content: "", summary: "", imageUrl: "", categoryId: 0, author: "", published: false }); setShowPostForm(true) }
    const openEditPost = (p: BlogPost) => { setEditPost(p); setPostForm({ title: p.title, slug: p.slug, content: p.content, summary: p.summary || "", imageUrl: p.imageUrl || "", categoryId: p.categoryId || 0, author: p.author || "", published: p.published }); setShowPostForm(true) }

    const savePost = async () => {
        if (!postForm.title || !postForm.content) { toast.error("BaÅŸlÄ±k ve iÃ§erik gerekli"); return }
        if (!postForm.categoryId || postForm.categoryId <= 0) { toast.error("Kategori seÃ§imi zorunlu"); return }
        try {
            if (editPost) { await blogApi.adminUpdatePost(editPost.id, postForm); toast.success("GÃ¼ncellendi") }
            else { await blogApi.adminCreatePost(postForm); toast.success("OluÅŸturuldu") }
            setShowPostForm(false); await loadAll()
        } catch { toast.error("BaÅŸarÄ±sÄ±z") }
    }

    const uploadPostImage = async (file: File) => {
        setUploadingImage(true)
        try {
            const url = await fileApi.upload(file)
            setPostForm((prev) => ({ ...prev, imageUrl: url }))
            toast.success("Gorsel yuklendi")
        } catch {
            toast.error("Gorsel yuklenemedi")
        } finally {
            setUploadingImage(false)
        }
    }

    const deletePost = async (id: number) => {
        if (!confirm("Silmek istediÄŸinize emin misiniz?")) return
        try { await blogApi.adminDeletePost(id); toast.success("Silindi"); loadAll() }
        catch { toast.error("Silinemedi") }
    }

    // Categories
    const openCreateCat = () => { setEditCat(null); setCatForm({ name: "", slug: "", active: true }); setShowCatForm(true) }
    const openEditCat = (c: BlogCategory) => { setEditCat(c); setCatForm({ name: c.name, slug: c.slug, active: c.active }); setShowCatForm(true) }

    const saveCat = async () => {
        if (!catForm.name) { toast.error("Ad gerekli"); return }
        try {
            if (editCat) { await blogApi.adminUpdateCategory(editCat.id, catForm); toast.success("GÃ¼ncellendi") }
            else { await blogApi.adminCreateCategory(catForm); toast.success("OluÅŸturuldu") }
            setShowCatForm(false); loadAll()
        } catch { toast.error("BaÅŸarÄ±sÄ±z") }
    }

    const deleteCat = async (id: number) => {
        if (!confirm("Silmek istediÄŸinize emin misiniz?")) return
        try { await blogApi.adminDeleteCategory(id); toast.success("Silindi"); loadAll() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    const getCatName = (id: number) => categories.find(c => c.id === id)?.name || "â€”"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Blog</h1>
                    <p className="text-muted-foreground">Blog yazÄ±larÄ± ve kategorileri yÃ¶netin</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={tab === "posts" ? "default" : "outline"} onClick={() => setTab("posts")}>YazÄ±lar ({posts.length})</Button>
                    <Button variant={tab === "categories" ? "default" : "outline"} onClick={() => setTab("categories")}><FolderOpen className="h-4 w-4 mr-1" /> Kategoriler ({categories.length})</Button>
                </div>
            </div>

            {tab === "posts" && (
                <>
                    <div className="flex justify-end"><Button className="gap-2" onClick={openCreatePost}><Plus className="h-4 w-4" /> Yeni YazÄ±</Button></div>
                    {posts.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">HenÃ¼z yazÄ± yok</CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {posts.map((p) => (
                                <Card key={p.id} className={!p.published ? "opacity-60" : ""}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {p.imageUrl ? <Image src={p.imageUrl} alt="" width={80} height={56} className="h-14 w-20 rounded-lg object-cover shrink-0" unoptimized /> : <div className="h-14 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0"><PenTool className="h-5 w-5 text-muted-foreground" /></div>}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{p.title}</p>
                                                <p className="text-xs text-muted-foreground">{getCatName(p.categoryId)} Â· {p.author || "â€”"} Â· {p.createdAt ? formatDateTR(p.createdAt, "minimal") : "â€”"}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant={p.published ? "default" : "outline"}>{p.published ? "YayÄ±nda" : "Taslak"}</Badge>
                                                <Button size="icon" variant="ghost" onClick={() => openEditPost(p)}><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePost(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === "categories" && (
                <>
                    <div className="flex justify-end"><Button className="gap-2" onClick={openCreateCat}><Plus className="h-4 w-4" /> Yeni Kategori</Button></div>
                    {categories.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">HenÃ¼z kategori yok</CardContent></Card>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((c) => (
                                <Card key={c.id} className={!c.active ? "opacity-50" : ""}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground font-mono">/{c.slug}</p></div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => openEditCat(c)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCat(c.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Post Form */}
            <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editPost ? "YazÄ±yÄ± DÃ¼zenle" : "Yeni Blog YazÄ±sÄ±"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">BaÅŸlÄ±k</label><Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Slug</label><Input value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} placeholder="otomatik" /></div>
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Ã–zet</label><Textarea rows={2} value={postForm.summary} onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium">Ä°Ã§erik</label><Textarea rows={10} value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} /></div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">GÃ¶rsel</label><Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPostImage(file) }} disabled={uploadingImage} /><Input value={postForm.imageUrl} readOnly placeholder={uploadingImage ? "Yukleniyor..." : "Cloudinary URL otomatik dolacak"} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Yazar</label><Input value={postForm.author} onChange={(e) => setPostForm({ ...postForm, author: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Kategori</label>
                                <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={postForm.categoryId} onChange={(e) => setPostForm({ ...postForm, categoryId: Number(e.target.value) })}>
                                    <option value={0}>SeÃ§in</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={postForm.published} onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })} /><label className="text-sm font-medium">YayÄ±nla</label></div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Ä°ptal</Button></DialogClose><Button onClick={savePost}>{editPost ? "GÃ¼ncelle" : "OluÅŸtur"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Form */}
            <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editCat ? "Kategori DÃ¼zenle" : "Yeni Kategori"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-sm font-medium">Ad</label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium">Slug</label><Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} /></div>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} /><label className="text-sm font-medium">Aktif</label></div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Ä°ptal</Button></DialogClose><Button onClick={saveCat}>{editCat ? "GÃ¼ncelle" : "Ekle"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}



