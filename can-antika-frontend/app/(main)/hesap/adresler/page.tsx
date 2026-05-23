"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Check, ChevronDown, Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
import { normalizeAddressSearch } from "@/lib/geo/address-search"
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

function comboboxOptions(items: TurkiyeAddressUnit[], query: string) {
  const normalizedQuery = normalizeAddressSearch(query)
  if (!normalizedQuery) return items
  return items.filter((item) => normalizeAddressSearch(item.name).includes(normalizedQuery))
}

interface AddressComboboxProps {
  label: string
  value: string
  searchValue: string
  options: TurkiyeAddressUnit[]
  selectedOption?: TurkiyeAddressUnit
  placeholder: string
  emptyText: string
  loading?: boolean
  disabled?: boolean
  onSearchChange: (value: string) => void
  onSelect: (value: string) => void
}

function AddressCombobox({
  label,
  value,
  searchValue,
  options,
  selectedOption,
  placeholder,
  emptyText,
  loading = false,
  disabled = false,
  onSearchChange,
  onSelect,
}: AddressComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative space-y-2">
      <Label className="text-[13px] font-semibold text-stone-800">{label}</Label>
      <div className="relative">
        <Input
          role="combobox"
          aria-expanded={isOpen}
          value={searchValue}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            onSearchChange(event.target.value)
            setIsOpen(true)
          }}
          placeholder={loading ? "Yükleniyor..." : placeholder}
          disabled={disabled || loading}
          className="h-11 rounded-md border-stone-300 bg-stone-50/80 pr-10 text-stone-900 shadow-inner shadow-stone-200/40 placeholder:text-stone-400 focus-visible:border-primary/60 focus-visible:ring-primary/15"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      </div>
      {isOpen && !disabled && !loading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-primary/20 bg-stone-50 p-1 shadow-xl shadow-stone-950/10">
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-stone-800 transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                onMouseDown={(event) => {
                  event.preventDefault()
                  onSelect(String(option.id))
                  setIsOpen(false)
                }}
              >
                <span>{option.name}</span>
                {value === String(option.id) || selectedOption?.id === option.id ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-stone-500">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  )
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
  const [provinceSearch, setProvinceSearch] = useState("")
  const [districtSearch, setDistrictSearch] = useState("")
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("")

  const selectedProvince = provinces.find((province) => String(province.id) === selectedProvinceId)
  const selectedDistrict = districts.find((district) => String(district.id) === selectedDistrictId)
  const selectedNeighborhood = neighborhoods.find((neighborhood) => String(neighborhood.id) === selectedNeighborhoodId)
  const filteredProvinces = comboboxOptions(provinces, provinceSearch)
  const filteredDistricts = comboboxOptions(districts, districtSearch)
  const filteredNeighborhoods = comboboxOptions(neighborhoods, neighborhoodSearch)

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
            setProvinceSearch(province.name)
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
          setDistrictSearch(district?.name || "")
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
          setNeighborhoodSearch(neighborhood?.name || "")
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
    setProvinceSearch("")
    setDistrictSearch("")
    setNeighborhoodSearch("")
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
          <DialogContent className="max-h-[92vh] overflow-y-auto border border-primary/20 bg-[#f8f3ea] p-0 text-stone-900 shadow-2xl shadow-stone-950/20 sm:max-w-2xl">
            <DialogHeader className="border-b border-primary/15 bg-[#efe5d5] px-6 py-5">
              <DialogTitle className="font-serif text-2xl text-stone-950">
                {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </DialogTitle>
              <DialogDescription className="text-stone-600">Teslimat adresinizi eksiksiz girin</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAddress} className="space-y-5 px-6 py-5">
              <input type="hidden" name="city" value={selectedProvince?.name || ""} readOnly />
              <input type="hidden" name="district" value={selectedDistrict?.name || ""} readOnly />
              <input type="hidden" name="neighborhood" value={selectedNeighborhood?.name || ""} readOnly />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[13px] font-semibold text-stone-800">Adres Başlığı</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Örn: Ev, İş"
                    defaultValue={editingAddress?.title}
                    required
                    className="h-11 border-stone-300 bg-stone-50/80 text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-primary/60 focus-visible:ring-primary/15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-[13px] font-semibold text-stone-800">Ülke</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={editingAddress?.country || "Türkiye"}
                    required
                    className="h-11 border-stone-300 bg-stone-50/80 text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-primary/60 focus-visible:ring-primary/15"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[13px] font-semibold text-stone-800">Telefon</Label>
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
                  className="h-11 border-stone-300 bg-stone-50/80 text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-primary/60 focus-visible:ring-primary/15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine" className="text-[13px] font-semibold text-stone-800">Adres satırı</Label>
                <Textarea
                  id="addressLine"
                  name="addressLine"
                  rows={2}
                  defaultValue={editingAddress?.addressLine}
                  required
                  className="min-h-24 border-stone-300 bg-stone-50/80 text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-primary/60 focus-visible:ring-primary/15"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <AddressCombobox
                  label="İl"
                  value={selectedProvinceId}
                  searchValue={provinceSearch}
                  options={filteredProvinces}
                  selectedOption={selectedProvince}
                  placeholder="İl seçin veya yazın"
                  emptyText="İl bulunamadı"
                  loading={isLoadingProvinces}
                  onSearchChange={(value) => {
                    setProvinceSearch(value)
                    setSelectedProvinceId("")
                    setSelectedDistrictId("")
                    setSelectedNeighborhoodId("")
                    setDistrictSearch("")
                    setNeighborhoodSearch("")
                    setDistricts([])
                    setNeighborhoods([])
                  }}
                  onSelect={(value) => {
                      const unit = provinces.find((province) => String(province.id) === value)
                      setProvinceSearch(unit?.name || "")
                      setSelectedProvinceId(value)
                      setSelectedDistrictId("")
                      setSelectedNeighborhoodId("")
                      setDistricts([])
                      setNeighborhoods([])
                      setDistrictSearch("")
                      setNeighborhoodSearch("")
                      setIsLoadingDistricts(true)
                    }}
                />
                <AddressCombobox
                  label="İlçe"
                  value={selectedDistrictId}
                  searchValue={districtSearch}
                  options={filteredDistricts}
                  selectedOption={selectedDistrict}
                  placeholder="İlçe seçin veya yazın"
                  emptyText={selectedProvinceId ? "İlçe bulunamadı" : "Önce il seçin"}
                  loading={isLoadingDistricts}
                  disabled={!selectedProvinceId}
                  onSearchChange={(value) => {
                    setDistrictSearch(value)
                    setSelectedDistrictId("")
                    setSelectedNeighborhoodId("")
                    setNeighborhoodSearch("")
                    setNeighborhoods([])
                  }}
                  onSelect={(value) => {
                      const unit = districts.find((district) => String(district.id) === value)
                      setDistrictSearch(unit?.name || "")
                      setSelectedDistrictId(value)
                      setSelectedNeighborhoodId("")
                      setNeighborhoods([])
                      setNeighborhoodSearch("")
                      setIsLoadingNeighborhoods(true)
                    }}
                />
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-[13px] font-semibold text-stone-800">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={editingAddress?.postalCode}
                    required
                    className="h-11 border-stone-300 bg-stone-50/80 text-stone-900 shadow-inner shadow-stone-200/40 focus-visible:border-primary/60 focus-visible:ring-primary/15"
                  />
                </div>
              </div>
              <AddressCombobox
                label="Mahalle / Köy"
                value={selectedNeighborhoodId}
                searchValue={neighborhoodSearch}
                options={filteredNeighborhoods}
                selectedOption={selectedNeighborhood}
                placeholder="Mahalle/Köy seçin veya yazın"
                emptyText={selectedDistrictId ? "Mahalle/Köy bulunamadı" : "Önce ilçe seçin"}
                loading={isLoadingNeighborhoods}
                disabled={!selectedDistrictId}
                onSearchChange={(value) => {
                  setNeighborhoodSearch(value)
                  setSelectedNeighborhoodId("")
                }}
                onSelect={(value) => {
                    const unit = neighborhoods.find((item) => String(item.id) === value)
                    setNeighborhoodSearch(unit?.name || "")
                    setSelectedNeighborhoodId(value)
                    const postalInput = document.getElementById("postalCode") as HTMLInputElement | null
                    if (unit?.postalCode && postalInput) postalInput.value = unit.postalCode
                  }}
              />
              <div className="flex gap-3 border-t border-primary/15 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground shadow-md shadow-primary/20" disabled={isSaving}>
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
