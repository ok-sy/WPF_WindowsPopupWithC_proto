Option Explicit
Dim app, doc, fso, toc, errorCode, errorMessage
If WScript.Arguments.Count <> 2 Then
  WScript.Echo "Usage: cscript export-interface-pdf.vbs input.docx output.pdf"
  WScript.Quit 2
End If
Set fso = CreateObject("Scripting.FileSystemObject")
On Error Resume Next
Set app = CreateObject("Word.Application")
app.Visible = False
app.DisplayAlerts = 0
Set doc = app.Documents.Open(fso.GetAbsolutePathName(WScript.Arguments(0)))
doc.Fields.Update
doc.Repaginate
For Each toc In doc.TablesOfContents
  toc.Update
Next
doc.Repaginate
doc.Save
doc.ExportAsFixedFormat fso.GetAbsolutePathName(WScript.Arguments(1)), 17
errorCode = Err.Number
errorMessage = Err.Description
doc.Close 0
app.Quit
If errorCode <> 0 Then
  WScript.Echo errorMessage
  WScript.Quit 1
End If
WScript.Echo "Word fields updated and PDF exported."
