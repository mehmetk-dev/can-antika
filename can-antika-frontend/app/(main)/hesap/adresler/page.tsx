"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAddresses } from "@/hooks/useAddresses"
import type { AddressResponse, AddressRequest } from "@/lib/types"
import { getTurkiyeAddressUnits, type TurkiyeAddressUnit } from "@/lib/geo/turkiye-address"
import { toast } from "sonner"

const TURKISH_PHONE_PATTERN = /^(?:(?:\+?90|0)[\s-]?)?(?:\(?[2345]\d{2}\)?)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/

function isValidTurkishPhone(value: string): boolean {
  return TURKISH_PHONE_PATTERN.test(value.trim())
}

function findUnitByName(items: TurkiyeAddressUnit[], name?: string | null) {
  const normalizedName = name?.trim().toLocaleLowerCase("tr")
  if (!normalizedName) return undefined
  return items.find((item) => item.name.toLocaleLowerCase("tr") === normalizedName)
}

function AddressesContent() {
  const { addresses, isLoading, isSaving, saveAddress, deleteAddress } = useAddresses()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  const [provinces, setProvinces] = useState<TurkiyeAddressUnit[]>([])
  const [districts, setDistricts] = useState<TurkiyeAddressUnit[]>([])
  const [neighborhoods, setNeighborhoods] = useState<TurkiyeAddressUnit[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false)
  const [selectedProvinceId, setSelectedProvinceId] = useState("")
  const [selectedDistrictId, setSelectedDistrictId] = useState("")
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState("")

  const selectedProvince = provinces.find((province) => String(province.id) === selectedProvinceId)
  const selectedDistrict = districts.find((district) => String(district.id) === selectedDistrictId)
  const selectedNeighborhood = neighborhoods.find((neighborhood) => String(neighborhood.id) === selectedNeighborhoodId)

  useEffect(() => {
    if (!isDialogOpen || provinces.length > 0) return

    getTurkiyeAddressUnits("provinces")
      .then((items) => {
        setProvinces(items)
        if (editingAddress?.city) {
          const province = findUnitByName(items, editingAddress.city)
          if (province) {
            setIsLoadingDistricts(true)
            setSelectedProvinceId(String(province.id))
          }
        }
      })
      .catch(() => toast.error("İl listesi alınamadı"))
      .finally(() => setIsLoadingProvinces(false))
  }, [isDialogOpen, provinces.length, editingAddress?.city])

  useEffect(() => {
    if (!selectedProvinceId) return

    getTurkiyeAddressUnits("districts", { provinceId: selectedProvinceId })
      .then((items) => {
        setDistricts(items)
        if (editingAddress?.district) {
          const district = findUnitByName(items, editingAddress.district)
          setSelectedDistrictId(district ? String(district.id) : "")
        }
      })
      .catch(() => toast.error("İlçe listesi alınamadı"))
      .finally(() => setIsLoadingDistricts(false))
  }, [selectedProvinceId, editingAddress?.district])

  useEffect(() => {
    if (!selectedDistrictId) return

    getTurkiyeAddressUnits("neighborhoods", { districtId: selectedDistrictId })
      .then((items) => {
        setNeighborhoods(items)
        if (editingAddress?.neighborhood) {
          const neighborhood = findUnitByName(items, editingAddress.neighborhood)
          setSelectedNeighborhoodId(neighborhood ? String(neighborhood.id) : "")
        }
      })
      .catch(() => toast.error("Mahalle/Köy listesi alınamadı"))
      .finally(() => setIsLoadingNeighborhoods(false))
  }, [selectedDistrictId, editingAddress?.neighborhood])

  const resetAddressSelection = () => {
    setSelectedProvinceId("")
    setSelectedDistrictId("")
    setSelectedNeighborhoodId("")
    setDistricts([])
    setNeighborhoods([])
  }

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phone = (formData.get("phone") ?? "").toString().trim()
    if (!isValidTurkishPhone(phone)) {
      toast.error("Geçerli bir telefon numarası girin")
      return
    }
    const data: AddressRequest = {
      title: formData.get("title") as string,
      country: (formData.get("country") as string) || "Türkiye",
      city: selectedProvince?.name || "",
      district: selectedDistrict?.name || "",
      neighborhood: selectedNeighborhood?.name || "",
      phone,
      postalCode: formData.get("postalCode") as string,
      addressLine: formData.get("addressLine") as string,
    }

    if (!data.city || !data.district || !data.neighborhood) {
      toast.error("İl, ilçe ve mahalle/köy seçin")
      return
    }

    const success = await saveAddress(data, editingAddress?.id)
    if (success) {
      setIsDialogOpen(false)
      setEditingAddress(null)
    }
  }

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return
    await deleteAddress(id)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Adresler yükleniyor...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Adreslerim</h1>
          <p className="mt-2 text-muted-foreground">Kayıtlı teslimat adreslerinizi yönetin</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (open && provinces.length === 0) {
              setIsLoadingProvinces(true)
            }
            if (!open) {
              setEditingAddress(null)
              resetAddressSelection()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-primary text-primary-foreground"
              onClick={() => {
                setEditingAddress(null)
                resetAddressSelection()
                if (provinces.length === 0) {
                  setIsLoadingProvinces(true)
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Yeni Adres
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-background">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </DialogTitle>
              <DialogDescription>Teslimat adresinizi girin</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              <input type="hidden" name="city" value={selectedProvince?.name || ""} readOnly />
              <input type="hidden" name="district" value={selectedDistrict?.name || ""} readOnly />
              <input type="hidden" name="neighborhood" value={selectedNeighborhood?.name || ""} readOnly />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Adres Başlığı</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Örn: Ev, İş"
                    defaultValue={editingAddress?.title}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Ülke</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={editingAddress?.country || "Türkiye"}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  defaultValue={editingAddress?.phone || ""}
                  required
                  maxLength={20}
                  pattern="(?:(?:\+?90|0)[\s-]?)?(?:\(?[2345]\d{2}\)?)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}"
                  title="Geçerli bir telefon numarası girin: 05XX XXX XX XX"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine">Adres</Label>
                <Textarea
                  id="addressLine"
                  name="addressLine"
                  rows={2}
                  defaultValue={editingAddress?.addressLine}
                  required
                  className="bg-muted/50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>İl</Label>
                  <Select
                    value={selectedProvinceId}
                    onValueChange={(value) => {
                      setSelectedProvinceId(value)
                      setSelectedDistrictId("")
                      setSelectedNeighborhoodId("")
                      setDistricts([])
                      setNeighborhoods([])
                      setIsLoadingDistricts(true)
                    }}
                    disabled={isLoadingProvinces}
                    required
                  >
                    <SelectTrigger className="w-full bg-muted/50">
                      <SelectValue placeholder={isLoadingProvinces ? "Yükleniyor..." : "İl seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={String(province.id)}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>İlçe</Label>
                  <Select
                    value={selectedDistrictId}
                    onValueChange={(value) => {
                      setSelectedDistrictId(value)
                      setSelectedNeighborhoodId("")
                      setNeighborhoods([])
                      setIsLoadingNeighborhoods(true)
                    }}
                    disabled={!selectedProvinceId || isLoadingDistricts}
                    required
                  >
                    <SelectTrigger className="w-full bg-muted/50">
                      <SelectValue placeholder={isLoadingDistricts ? "Yükleniyor..." : "İlçe seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={String(district.id)}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={editingAddress?.postalCode}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mahalle / Köy</Label>
                <Select
                  value={selectedNeighborhoodId}
                  onValueChange={(value) => {
                    setSelectedNeighborhoodId(value)
                    const unit = neighborhoods.find((item) => String(item.id) === value)
                    const postalInput = document.getElementById("postalCode") as HTMLInputElement | null
                    if (unit?.postalCode && postalInput) postalInput.value = unit.postalCode
                  }}
                  disabled={!selectedDistrictId || isLoadingNeighborhoods}
                  required
                >
                  <SelectTrigger className="w-full bg-muted/50">
                    <SelectValue placeholder={isLoadingNeighborhoods ? "Yükleniyor..." : "Mahalle/Köy seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={String(neighborhood.id)}>
                        {neighborhood.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">{address.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        resetAddressSelection()
                        setEditingAddress(address)
                        if (provinces.length > 0) {
                          const province = findUnitByName(provinces, address.city)
                          if (province) {
                            setIsLoadingDistricts(true)
                            setSelectedProvinceId(String(province.id))
                          }
                        } else {
                          setIsLoadingProvinces(true)
                        }
                        setIsDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>{address.addressLine}</p>
                  <p>
                    {[address.neighborhood, address.district, address.city].filter(Boolean).join(", ")} {address.postalCode}
                  </p>
                  <p>Telefon: {address.phone || "Eklenmemiş"}</p>
                  <p>{address.country}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-serif text-xl text-foreground">Kayıtlı adresiniz yok</p>
          <p className="mt-2 text-muted-foreground">Teslimat için adres ekleyin</p>
        </div>
      )}
    </>
  )
}

export default function AddressesPage() {
  return <AddressesContent />
}
