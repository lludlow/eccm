# User Manual

This tool helps you visually map, label, and manage Ethernet connections. It runs entirely in your browser, works offline, and saves everything automatically in your profile.  

---

## 📂 Profiles

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/ef2269ef-8c23-462b-8ee2-91ea4771d4b5" />
  
Profiles let you keep different layouts (e.g. home, client A, client B).

- **Create a new profile** → *Profiles* card → **New**  
- **Switch profiles** → Use the dropdown at the top of the *Profiles* card  
- **Rename** → Select a profile, then click **Rename**  
- **Duplicate** → Clone the current profile with **Duplicate**  
- **Delete** → Removes the current profile (at least one profile must exist)  
- **Export** → Save a single profile as a JSON file  
- **Import** → Load a profile from a JSON file

---

## 🖥️ Adding Devices

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/258a22fe-af58-40fc-b814-96d53bfff7c3" />

Each device is shown as a card with its own ports. Using clear names and distinct colours makes layouts easier to read, especially when you have multiple switches or patch panels. You can also edit or delete devices later if your setup changes — everything autosaves. Devices can be linked together through their ports, giving you a live view of how your network fits together.  

- In the *Add device* card, enter a **name** (e.g. *Core Switch A*)  
- Choose the **number of ports** (1–512)  
- Click **Select colour** to assign a colour (helps distinguish devices)  
- Click **Add device**  
- Devices can be reordered by dragging them  

---

## ⚙️ Configuring Devices

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/af86ca1e-664e-4270-94d4-cccc04ef0ddb" />

Click **Layout** on a device to choose a **Standard port grid** or **FHD cassette enclosure**.

For a standard grid, choose device width, ports per row (0 means automatic),
row/column numbering, and whether small devices split into two rows.

**Port sides** enables dual-link documentation. Existing connections, aliases,
custom names, reservations, speeds and VLAN settings move to Front (side 1);
Rear (side 2) starts free. Devices with bonds or conflicting side-specific data
must be resolved first. Turning dual link off requires clearing endpoint data.

### FHD fiber enclosures

Create the device with its populated **LC duplex connection count**, then select
**Layout → FHD cassette enclosure**:

- **1U**: four cassette slots in one row; up to 48 LC duplex connections.
- **2U**: eight slots in two rows of four; up to 96 LC duplex connections.
- Each supported cassette contains 12 duplex connections (24 fibers), arranged
  as **LC07–LC12 above LC01–LC06**. The LC numbers identify duplex pairs;
  the cassette's printed fiber numbers run 1–24.
- Assign each cassette to a slot and optionally label it by destination.
  Choose a cassette color in **Layout** to distinguish A/B fabrics or racks.
  The color marks its border and heading and follows the cassette when moved.
  **Default** clears the custom color. Colors are retained in templates, JSON
  exports and printed layouts; port colors continue to show connection status.
  Unused slots display blank panels. Moving a cassette preserves its connections.
- Names such as **C2-LC01 / Front** identify the cassette, duplex connection and
  side in the connection table, prompts, cable labels and exports.

For the Rack10 installation, use **72 ports, 2U, dual link**. The default slot
arrangement pairs C1/C2 vertically for Rack11, C3/C4 for Rack12, and C5/C6 for
Rack13; the rightmost column stays empty. Each remote rack uses **24 ports, 1U,
dual link**, with two populated cassettes and two empty slots.

Connect equipment to Front and document the inter-rack circuits on Rear.
Rear represents the circuit through the MTP trunk, not a separate physical LC
socket or a Tx/Rx fiber. ECCM does not model MTP pin assignments or polarity.

Bulk-edit ranges retain enclosure numbering: C1 is ports 1–12, C2 is 13–24,
and so on. Change the populated port count through **Edit**, in multiples of 12.
Reducing it removes the highest-numbered cassettes and their affected links,
with the existing linked-port confirmation. Templates and JSON exports preserve
slot placement and cassette labels. Switching temporarily to the standard grid
also preserves the saved cassette layout.

---

## 🔗 Linking Ports

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/f9948f18-f1ac-48b1-a742-d2c3c002c8fe" />

When linking, you’ll be shown a confirmation prompt with both device names and port numbers, so you can double-check before saving the connection.  

- Click one free port, then another free port → confirm to create a connection  
- Both ends will be coloured with their peer’s device colour  
- Linked ports show an arrow ⇄  

---

## 🏷️ Labelling & Reserving Ports
- **ALT + Click** a port → add or edit a label (alias)  
  - Example: *WAN*, *Printer*, *AP-1*  
- **CTRL + Click** a port → mark it as *reserved* (grey background)  
  - Use for ports connected to devices **outside** this layout (e.g. ISP modem, patch panel, office uplink) - so they appear as connected without having to be linked to another port
  - Combine with ALT-label to describe what’s at the other end  
    - Example: CTRL-reserve port with a label for location, e.g. *Office*  → ALT-label to specify what's connected, e.g. *PC-4*  

---

## 💾 Backup & Restore (all profiles)

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/da133980-4be6-4c4d-b9b6-413cede3510d" />

Backups are useful if you want to move your layouts to another computer or just keep a copy in case your browser storage is cleared. Restoring will overwrite your current profiles, so it’s best to take a fresh backup first if you want to merge changes later. 

- **Backup all** → saves every profile (devices + links) into one JSON file  
- **Restore all** → load a backup and replace everything

---

## 🔍 Finding Connections

<img align="right" width="250" alt="image" src="https://github.com/user-attachments/assets/f0cf1111-f080-49f0-b396-331f0c8940b7" />

This makes it easy to track down a specific cable in larger layouts without scanning visually. You can search by device name, port number, or any custom alias you’ve added.  

- Use the search box (*Find connection* card) to filter by device, port, or alias  
- The *Connections* table shows all links, with both devices, ports, and labels  
- Click a row → highlights both ends of the link  

---

## ❌ Managing Connections

<img align="right" width="150" alt="image" src="https://github.com/user-attachments/assets/8bc8bb52-7854-4274-ae89-5829c1501a01" />

From the *Connections* table:
- **Unlink** → break a connection between two ports  
- **Clear** → clear a Reserved port (can also be cleared by **CTRL + clicking** the reserved port again)

---

## 🖨️ Printing
- Use **Print layout** (top-right) to generate a printable sheet of devices + connections  

---

## 📝 Tips
- Profiles autosave automatically — no need to press “Save”  
- Use colours to quickly group devices by type or rack position  
- Labels + reserved ports are powerful for documenting external links  

---

## Port groups and capabilities

Choose **Configure ports → Port groups** on a device. Give each group a name,
member ports (for example `1-48` or `49-52`), connector and maximum speed. Groups
on the same device cannot overlap. Ungrouped ports use the device maximum speed;
a group with an unspecified speed has an unknown maximum. The faceplate shows a
summary of every group and marks each group's first port.

Capabilities describe the hardware. Changing them does not overwrite recorded
port speeds. New links can receive an estimated speed from endpoint capabilities;
ECCM does not query devices or measure negotiated speed.

## Access and trunk VLANs

Right-click a port to edit it. Keyboard users can focus a port and press
**Shift+F10** to edit, or **Enter** to select/link it.

- **Access:** one VLAN ID, from 1 to 4094.
- **Trunk:** an optional native/untagged VLAN and allowed tagged VLANs, such as
  `20,30,100-110`. A blank tagged list means none, not all. The native VLAN cannot
  also be in the tagged list.
- **Unspecified:** clears the recorded VLAN configuration.

Older single-VLAN profiles appear as access ports. Both endpoints retain their
own configuration. Summaries appear in port hovers, the connection table,
printing and draw.io exports.

## Bulk editing

Choose **Configure ports → Edit ports in bulk**. Enter numbers or ranges such as
`1-24,49,50`, then check each setting you want to apply: alias, recorded speed or
VLAN configuration. Unchecked settings stay unchanged. Applying a blank value
clears that setting. On dual-link devices, select side 1, side 2 or both.

ECCM validates the entire edit before saving. A recorded speed cannot exceed a
known port-group or device maximum. Invalid ranges or VLANs leave all selected
ports unchanged.

## LAG / bond groups

Choose **Configure ports → LAG / bond groups**. Specify a name, LACP or static
mode, and at least two member ports. Each port can belong to only one bond on its
device. Configure the peer's bond separately. Bonds are documentation only and
are unavailable on dual-link patch panels.

Member ports display compact **B1**, **B2**, etc. badges. These are display keys
within each device, matched to full bond names and LACP/static modes in its
summary. The Connections table shows the matching badge beside each endpoint’s
port, including reserved ports; an unconfigured endpoint says **No bond
recorded**. Badges also appear in the printed layout.

Removing a port also removes its membership. A bond left with only one member
shows **Needs another member**, so incomplete documentation remains visible.

## Cable details and labels

In **Connections**, select **Cable details** (or an existing cable ID). Record a
unique cable ID, medium, length in metres, color and notes. These details belong
to the connection and are shared by both ends. Unlinking removes the connection
and its cable details.

Search accepts cable details, VLAN summaries and bond names. **Cable labels** in
the header opens a printable sheet with two labels per named cable, one for each
end, across the current profile. Each label includes its local and remote port.
The print layout also includes a port configuration list and cable schedule.

## Device templates

Choose **Configure ports → Save as device template**. Templates preserve layout,
color, port groups, speeds and VLAN configuration. They exclude connections,
cable IDs, aliases, reservations, custom port names, STP priority and bonds.

In **Add device**, select a template, enter a new device name, and choose **Add
device**. Templates belong to the active profile and travel with profile exports
and full backups. Deleting a template leaves devices made from it unchanged.

## STP priority

Set bridge priority in **Edit**. The lowest recorded priority in the current
profile is marked **Root candidate**, including ties. This is a planning hint,
not evidence of the operational root; ECCM does not discover STP domains,
instances, bridge IDs or forwarding state.

## Saving and compatibility

Continue to use **Export** for one profile and **Backup all** for every profile.
Both include port groups, VLAN configurations, bonds, cables and templates. Old
profiles remain importable. Older ECCM versions may discard the new metadata,
so keep a current backup before opening a profile in an older version.
