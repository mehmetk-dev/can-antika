"use client"

import { useState, useEffect } from "react"
import { PenTool, Plus, Pencil, Trash2, Loader2, Eye, FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { blogApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

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

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        try {
            const [p, c] = await Promise.all([blogApi.adminGetPosts(0, 100), blogApi.adminGetCategories()])
            setPosts(p.items || [])
            setCategories(c)
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    // Posts
    const openCreatePost = () => { setEditPost(null); setPostForm({ title: "", slug: "", content: "", summary: "", imageUrl: "", categoryId: 0, author: "", published: false }); setShowPostForm(true) }
    const openEditPost = (p: BlogPost) => { setEditPost(p); setPostForm({ title: p.title, slug: p.slug, content: p.content, summary: p.summary || "", imageUrl: p.imageUrl || "", categoryId: p.categoryId || 0, author: p.author || "", published: p.published }); setShowPostForm(true) }

    const savePost = async () => {
        if (!postForm.title || !postForm.content) { toast.error("Başlık ve içerik gerekli"); return }
        try {
            if (editPost) { await blogApi.adminUpdatePost(editPost.id, postForm); toast.success("Güncellendi") }
            else { await blogApi.adminCreatePost(postForm); toast.success("Oluşturuldu") }
            setShowPostForm(false); loadAll()
        } catch { toast.error("Başarısız") }
    }

    const deletePost = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await blogApi.adminDeletePost(id); toast.success("Silindi"); loadAll() }
        catch { toast.error("Silinemedi") }
    }

    // Categories
    const openCreateCat = () => { setEditCat(null); setCatForm({ name: "", slug: "", active: true }); setShowCatForm(true) }
    const openEditCat = (c: BlogCategory) => { setEditCat(c); setCatForm({ name: c.name, slug: c.slug, active: c.active }); setShowCatForm(true) }

    const saveCat = async () => {
        if (!catForm.name) { toast.error("Ad gerekli"); return }
        try {
            if (editCat) { await blogApi.adminUpdateCategory(editCat.id, catForm); toast.success("Güncellendi") }
            else { await blogApi.adminCreateCategory(catForm); toast.success("Oluşturuldu") }
            setShowCatForm(false); loadAll()
        } catch { toast.error("Başarısız") }
    }

    const deleteCat = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        try { await blogApi.adminDeleteCategory(id); toast.success("Silindi"); loadAll() }
        catch { toast.error("Silinemedi") }
    }

    if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    const getCatName = (id: number) => categories.find(c => c.id === id)?.name || "—"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Blog</h1>
                    <p className="text-muted-foreground">Blog yazıları ve kategorileri yönetin</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={tab === "posts" ? "default" : "outline"} onClick={() => setTab("posts")}>Yazılar ({posts.length})</Button>
                    <Button variant={tab === "categories" ? "default" : "outline"} onClick={() => setTab("categories")}><FolderOpen className="h-4 w-4 mr-1" /> Kategoriler ({categories.length})</Button>
                </div>
            </div>

            {tab === "posts" && (
                <>
                    <div className="flex justify-end"><Button className="gap-2" onClick={openCreatePost}><Plus className="h-4 w-4" /> Yeni Yazı</Button></div>
                    {posts.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz yazı yok</CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {posts.map((p) => (
                                <Card key={p.id} className={!p.published ? "opacity-60" : ""}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" /> : <div className="h-14 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0"><PenTool className="h-5 w-5 text-muted-foreground" /></div>}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{p.title}</p>
                                                <p className="text-xs text-muted-foreground">{getCatName(p.categoryId)} · {p.author || "—"} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString("tr-TR") : "—"}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant={p.published ? "default" : "outline"}>{p.published ? "Yayında" : "Taslak"}</Badge>
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
                        <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz kategori yok</CardContent></Card>
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
                    <DialogHeader><DialogTitle>{editPost ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">Başlık</label><Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Slug</label><Input value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} placeholder="otomatik" /></div>
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Özet</label><Textarea rows={2} value={postForm.summary} onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium">İçerik</label><Textarea rows={10} value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} /></div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1"><label className="text-sm font-medium">Görsel URL</label><Input value={postForm.imageUrl} onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Yazar</label><Input value={postForm.author} onChange={(e) => setPostForm({ ...postForm, author: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Kategori</label>
                                <select className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={postForm.categoryId} onChange={(e) => setPostForm({ ...postForm, categoryId: Number(e.target.value) })}>
                                    <option value={0}>Seçin</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={postForm.published} onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })} /><label className="text-sm font-medium">Yayınla</label></div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">İptal</Button></DialogClose><Button onClick={savePost}>{editPost ? "Güncelle" : "Oluştur"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Form */}
            <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editCat ? "Kategori Düzenle" : "Yeni Kategori"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-sm font-medium">Ad</label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium">Slug</label><Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} /></div>
                        <div className="flex items-center gap-2"><input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} /><label className="text-sm font-medium">Aktif</label></div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">İptal</Button></DialogClose><Button onClick={saveCat}>{editCat ? "Güncelle" : "Ekle"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
