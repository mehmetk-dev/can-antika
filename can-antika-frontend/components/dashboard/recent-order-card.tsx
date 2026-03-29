import Image from "next/image"
import { Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { OrderResponse } from "@/lib/types"

interface RecentOrderCardProps {
    recentOrders: OrderResponse[]
}

export default function RecentOrderCard({ recentOrders }: RecentOrderCardProps) {
    return (
        <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Sipariş Akışı</CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"><span className="text-xs">&lt;</span></Button>
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"><span className="text-xs">&gt;</span></Button>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-blue-500 hover:bg-blue-600 rounded">Sipariş No: {recentOrders[0].id}</Badge>
                            <span className="text-xs text-muted-foreground">- Ödeme Onayı Bekliyor</span>
                        </div>
                        <div className="text-sm font-bold text-foreground">
                            {recentOrders[0].user?.name || "Misafir Müşteri"} - ₺{recentOrders[0].totalAmount.toLocaleString("tr-TR")}
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-md">
                            <div className="h-10 w-10 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                                {recentOrders[0].orderItems?.[0]?.product?.imageUrls?.[0] ? (
                                    <Image src={recentOrders[0].orderItems[0].product.imageUrls[0]} alt="ürün resmi" width={40} height={40} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{recentOrders[0].orderItems?.[0]?.title}</p>
                                <p className="text-xs font-semibold text-blue-600">{recentOrders[0].orderItems?.[0]?.quantity} Adet</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-amber-50/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/70 dark:border-amber-900/30">
                        Kayıt bulunamadı.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
