import json

with open("can-antika-frontend/components/product/product-detail.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Gerekli kısmı (215. satıra kadar) ayır
new_content = ''.join(lines[:215])

append_text = """        {/* Tabs Section (Desktop) / Accordion (Mobile) */}
        <div className="mt-20 pt-10 border-t border-border/40">
          
          {/* DESKTOP TABS */}
          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-8 flex h-auto w-full justify-start gap-8 rounded-none border-b border-border/40 bg-transparent p-0">
                <TabsTrigger
                  value="details"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Detaylar
                </TabsTrigger>
                <TabsTrigger
                  value="provenance"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Hikaye & Köken
                </TabsTrigger>
                {condition && (
                  <TabsTrigger
                    value="condition"
                    className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Durum Raporu
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="reviews"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 font-serif text-sm tracking-wide text-muted-foreground transition-none data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Yorumlar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 outline-none">
                <div className="grid gap-x-12 gap-y-2 sm:grid-cols-2">
                  {era && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Dönem</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{eraLabels[era] || era}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Kategori</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{product.category.name}</span>
                    </div>
                  )}
                  {dimensions && (
                    <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Boyutlar</span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">{dimensions}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end border-b border-border/40 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Envanter No</span>
                    <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                    <span className="font-serif text-sm font-medium text-foreground text-right">CAN-{product.id.toString().padStart(4, "0")}</span>
                  </div>
                  {otherAttributes.map(({ key, value }) => (
                    <div key={key} className="flex justify-between items-end border-b border-border/40 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">
                        {key.lower() == "material" or key.lower() == "materyal" or key == "material" ? "Materyal" : "{key.toLowerCase() === 'material' ? 'Materyal' : key}"}
                      </span>
                      <div className="flex-grow mx-4 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="provenance" className="mt-0 outline-none">
                <div className="max-w-3xl prose prose-p:font-light prose-p:leading-loose prose-p:text-muted-foreground font-serif">
                  <p>
                    {provenance || "Bu eser hakkında detaylı hikaye ve köken bilgisi henüz eklenmedi. Uzman ekibimizle iletişime geçerek eserin tarihçesi ve kökeni hakkında geniş kapsamlı bilgi alabilirsiniz."}
                  </p>
                </div>
              </TabsContent>

              {condition && (
                <TabsContent value="condition" className="mt-0 outline-none">
                  <div className="max-w-3xl rounded-xl border border-[#d4af37]/20 bg-[#fbf9f6] p-8 mt-4">
                    <div className="flex items-center gap-3 mb-4 border-b border-[#d4af37]/20 pb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4af37]/10">
                        <Shield className="h-4 w-4 text-[#d4af37]" />
                      </div>
                      <div>
                        <p className="font-serif text-lg text-[#5c4a3d] tracking-wide">Uzman Onaylı</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-line">{condition}</p>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="reviews" className="mt-0 outline-none pt-4">
                <ProductReviews productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* MOBILE ACCORDION */}
          <div className="md:hidden">
            <Accordion type="single" collapsible defaultValue="details" className="w-full">
              <AccordionItem value="details" className="border-border/40">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Detaylar</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-y-1">
                    {era && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Dönem</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{eraLabels[era] || era}</span>
                      </div>
                    )}
                    {product.category && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Kategori</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{product.category.name}</span>
                      </div>
                    )}
                    {dimensions && (
                      <div className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Boyutlar</span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right">{dimensions}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end border-b border-border/40 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">Envanter No</span>
                      <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                      <span className="font-serif text-sm font-medium text-foreground text-right">CAN-{product.id.toString().padStart(4, "0")}</span>
                    </div>
                    {otherAttributes.map(({ key, value }) => (
                      <div key={key} className="flex justify-between items-end border-b border-border/40 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5c4a3d]/80">
                          {key.toLowerCase() === "material" ? "Materyal" : key}
                        </span>
                        <div className="flex-grow mx-2 border-b border-dotted border-[#5c4a3d]/20 mb-1" />
                        <span className="font-serif text-sm font-medium text-foreground text-right capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="provenance" className="border-border/40">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Hikaye & Köken</AccordionTrigger>
                <AccordionContent>
                  <p className="font-serif leading-relaxed text-muted-foreground">
                    {provenance || "Bu eser hakkında detaylı hikaye ve köken bilgisi henüz eklenmedi. Uzman ekibimizle iletişime geçerek eserin tarihçesi ve kökeni hakkında geniş kapsamlı bilgi alabilirsiniz."}
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              {condition && (
                <AccordionItem value="condition" className="border-border/40">
                  <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Durum Raporu</AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-xl border border-[#d4af37]/20 bg-[#fbf9f6] p-4 mt-2">
                      <div className="flex items-center gap-3 mb-3 border-b border-[#d4af37]/20 pb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4af37]/10">
                          <Shield className="h-3 w-3 text-[#d4af37]" />
                        </div>
                        <p className="font-serif text-base text-[#5c4a3d] tracking-wide">Uzman Onaylı</p>
                      </div>
                      <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-line text-sm">{condition}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              <AccordionItem value="reviews" className="border-border/40 border-b-0">
                <AccordionTrigger className="font-serif text-lg tracking-wide hover:no-underline">Yorumlar</AccordionTrigger>
                <AccordionContent>
                  <ProductReviews productId={product.id} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
    </main>
  )
}
"""

# Python escape character fixing before write
append_text = append_text.replace("{key.lower() == \"material\" or key.lower() == \"materyal\" or key == \"material\" ? \"Materyal\" : \"{key.toLowerCase() === 'material' ? 'Materyal' : key}\"}", "{key.toLowerCase() === 'material' ? 'Materyal' : key}")

with open("can-antika-frontend/components/product/product-detail.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)
    f.write(append_text)
