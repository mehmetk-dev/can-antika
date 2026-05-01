import Image from "next/image"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { OrderResponse } from "@/lib/types"
import { getOrderStatus } from "@/lib/commerce/order-utils"
import { formatDateTR } from "@/lib/utils"

interface RecentOrderCardProps {
    recentOrders: OrderResponse[]
}

export default function RecentOrderCard({ recentOrders }: RecentOrderCardProps) {
    return (
        <Card className="shadow-sm border-stone-200 overflow-hidden bg-white">
            <CardHeader className="py-3 px-5 border-b border-stone-200 flex flex-row items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-sky-100 flex items-center justify-center">
                        <Package className="h-3.5 w-3.5 text-sky-700" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">Son Siparişler</CardTitle>
                </div>
                <Link prefetch={false} href="/admin/siparisler" className="text-[11px] text-stone-400 hover:text-amber-700 flex items-center gap-0.5 transition-colors font-medium">
                    Tümü <ChevronRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                {recentOrders.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                        {recentOrders.slice(0, 4).map((order) => {
                            const status = getOrderStatus(order.orderStatus)
                            const firstItem = order.orderItems?.[0]
                            const itemCount = order.orderItems?.length || 0

                            return (
                                <Link
                                    key={order.id}
                                    prefetch={false}
                                    href={`/admin/siparisler`}
                                    className="group flex items-center gap-3.5 px-5 py-3 hover:bg-amber-50/30 transition-colors duration-150"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 border border-stone-200">
                                        {firstItem?.product?.imageUrls?.[0] ? (
                                            <Image
                                                src={firstItem.product.imageUrls[0]}
                                                alt={firstItem.title || "ürün"}
                                                width={40}
                                                height={40}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Package className="h-4 w-4 text-stone-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[12px] font-semibold text-stone-800">
                                                #{order.id}
                                            </span>
                                            <Badge variant={status.variant} className={`${status.className} text-[10px] px-1.5 py-0 h-4 leading-none`}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-stone-500 truncate">
                                            {order.user?.name || "Misafir"} · {firstItem?.title}{itemCount > 1 ? ` +${itemCount - 1}` : ""}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[13px] font-bold tabular-nums text-stone-800">
                                            ₺{order.totalAmount.toLocaleString("tr-TR")}
                                        </p>
                                        {order.orderDate && (
                                            <p className="text-[10px] text-stone-400 mt-0.5">
                                                {formatDateTR(order.orderDate, "compact")}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-sm text-stone-400">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Henüz sipariş yok.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
