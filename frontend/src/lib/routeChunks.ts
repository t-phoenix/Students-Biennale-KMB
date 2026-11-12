/** Code for pages that open from a tap, shared by the router and by whoever warms it early.
 *  The browser fetches each file once; calling these again only returns the same module. */
export const loadDetail = () => import("../pages/Detail");
