import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer, Save, FileText, Plus, Trash2 } from "lucide-react";

interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultTemplates = [
  {
    id: "dmv-bill-of-sale",
    name: "DMV Bill of Sale",
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 16px;">BILL OF SALE</h2>
          <p style="margin: 5px 0; font-size: 10px;">A Public Service Agency</p>
        </div>

        <div style="border: 1px solid #000; margin-bottom: 15px;">
          <div style="background-color: #f0f0f0; padding: 5px; text-align: center; font-weight: bold; border-bottom: 1px solid #000;">
            VEHICLE/VESSEL DESCRIPTION
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-right: 1px solid #000; padding: 5px; width: 25%; font-size: 10px;">IDENTIFICATION NUMBER</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 15%; font-size: 10px;">YEAR</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 15%; font-size: 10px;">MODEL</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 15%; font-size: 10px;">MAKE</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 15%; font-size: 10px;">LICENSE PLATE #</td>
              <td style="padding: 5px; width: 15%; font-size: 10px;">MOTORCYCLE ENGINE #</td>
            </tr>
            <tr>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px; height: 30px;">{{vin_number}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{vehicle_year}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{vehicle_model}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{vehicle_make}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{license_plate}}</td>
              <td style="border-top: 1px solid #000; padding: 10px;">{{motorcycle_engine}}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0;">
            <span style="font-weight: bold;">{{seller_company}}</span> sell, transfer, and deliver the above vehicle/vessel
          </p>
          <p style="margin: 5px 0;">
            to <span style="font-weight: bold;">{{buyer_company}}</span> on {{sale_date}} for the amount of <span style="border: 1px solid #000; padding: 2px;">$<span style="font-weight: bold;">{{selling_price}}</span></span>
          </p>
          <p style="margin: 10px 0; font-size: 10px;">
            If this was a gift, indicate relationship: <span style="margin-left: 20px;">(e.g., parent, spouse, friend, etc.)</span> {{gift_relationship}} <span style="border: 1px solid #000; padding: 2px; margin-left: 10px;">$<span style="font-weight: bold;">{{gift_value}}</span></span>
          </p>
          <p style="margin: 5px 0; font-size: 10px; text-align: right;">(GIFT VALUE)</p>
        </div>

        <div style="border: 1px solid #000; margin-bottom: 15px;">
          <div style="background-color: #f0f0f0; padding: 5px; text-align: center; font-weight: bold; border-bottom: 1px solid #000;">
            SELLER
          </div>
          <p style="margin: 5px; font-size: 10px; font-style: italic;">
            I certify (or declare) under penalty of perjury under the laws of the State of California that the foregoing is true and correct.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-right: 1px solid #000; padding: 5px; width: 33%; font-size: 10px;">PRINT NAME</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 33%; font-size: 10px;">SIGNATURE</td>
              <td style="border-right: 1px solid #000; padding: 5px; width: 17%; font-size: 10px;">DATE</td>
              <td style="padding: 5px; width: 17%; font-size: 10px;">TEL. (D) OR DEALER #</td>
            </tr>
            <tr>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px; height: 30px;">{{seller_name}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">X</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{seller_date}}</td>
              <td style="border-top: 1px solid #000; padding: 10px;">{{seller_phone}}</td>
            </tr>
            <tr>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 5px; font-size: 10px;">MAILING ADDRESS</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 5px; font-size: 10px;">CITY</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 5px; font-size: 10px;">STATE</td>
              <td style="border-top: 1px solid #000; padding: 5px; font-size: 10px;">ZIP</td>
            </tr>
            <tr>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px; height: 30px;">{{seller_address}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{seller_city}}</td>
              <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{seller_state}}</td>
              <td style="border-top: 1px solid #000; padding: 10px;">{{seller_zip}}</td>
            </tr>
          </table>
        </div>

        <div style="border: 1px solid #000; margin-bottom: 15px;">
          <div style="background-color: #f0f0f0; padding: 5px; text-align: center; font-weight: bold; border-bottom: 1px solid #000;">
            BUYER
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-bottom: 1px solid #000; padding: 5px; font-size: 10px;">PRINT NAME</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #000; padding: 10px; height: 30px;">{{buyer_name}}</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #000; padding: 5px; font-size: 10px;">PRINT NAME</td>
            </tr>
            <tr>
              <td style="border-bottom: 1px solid #000; padding: 10px; height: 30px;">{{buyer_name_2}}</td>
            </tr>
            <tr>
              <td style="padding: 5px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border-right: 1px solid #000; padding: 5px; width: 40%; font-size: 10px;">MAILING ADDRESS</td>
                    <td style="border-right: 1px solid #000; padding: 5px; width: 30%; font-size: 10px;">CITY</td>
                    <td style="border-right: 1px solid #000; padding: 5px; width: 15%; font-size: 10px;">STATE</td>
                    <td style="padding: 5px; width: 15%; font-size: 10px;">ZIP</td>
                  </tr>
                  <tr>
                    <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px; height: 30px;">{{buyer_address}}</td>
                    <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{buyer_city}}</td>
                    <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 10px;">{{buyer_state}}</td>
                    <td style="border-top: 1px solid #000; padding: 10px;">{{buyer_zip}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 10px; font-weight: bold;">CUT ON LINE AND SAVE FOR YOUR RECORDS</p>
        </div>
      </div>
    `
  },
  {
    id: "invoice",
    name: "Invoice Template",
    content: `
      <h1 style="text-align: center; color: #2563eb;">INVOICE</h1>
      <div style="margin: 20px 0;">
        <p><strong>From:</strong> {{company_name}}</p>
        <p>{{company_address}}</p>
        <p>{{company_phone}}</p>
      </div>
      <div style="margin: 20px 0;">
        <p><strong>To:</strong> {{customer_name}}</p>
        <p>{{customer_address}}</p>
      </div>
      <div style="margin: 20px 0;">
        <p><strong>Invoice #:</strong> {{invoice_number}}</p>
        <p><strong>Date:</strong> {{date}}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Description</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Amount</th>
        </tr>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">{{description}}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">{{amount}}</td>
        </tr>
      </table>
      <div style="text-align: right; margin-top: 20px;">
        <p><strong>Total: {{total}}</strong></p>
      </div>
    `
  },
  {
    id: "vehicle-form",
    name: "Vehicle Information Form",
    content: `
      <h1 style="text-align: center; color: #2563eb;">Vehicle Information Form</h1>
      <div style="margin: 20px 0;">
        <p><strong>Vehicle ID:</strong> {{vehicle_id}}</p>
        <p><strong>Make:</strong> {{make}}</p>
        <p><strong>Model:</strong> {{model}}</p>
        <p><strong>Year:</strong> {{year}}</p>
        <p><strong>VIN:</strong> {{vin}}</p>
      </div>
      <div style="margin: 20px 0;">
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Condition:</strong> {{condition}}</p>
        <p><strong>Notes:</strong></p>
        <div style="border: 1px solid #d1d5db; min-height: 100px; padding: 10px;">
          {{notes}}
        </div>
      </div>
      <div style="margin: 20px 0;">
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Inspector:</strong> {{inspector}}</p>
      </div>
    `
  }
];

export function CustomDocumentEditor() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [content, setContent] = useState("");
  const [mergeFields, setMergeFields] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem("document-templates");
    if (saved) {
      const parsedTemplates = JSON.parse(saved);
      // Convert date strings back to Date objects
      const templatesWithDates = parsedTemplates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
      setTemplates(templatesWithDates);
    } else {
      const initialTemplates = defaultTemplates.map(t => ({
        ...t,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      setTemplates(initialTemplates);
      localStorage.setItem("document-templates", JSON.stringify(initialTemplates));
    }
  };

  const saveTemplates = (newTemplates: DocumentTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem("document-templates", JSON.stringify(newTemplates));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTemplateName(template.name);
      setContent(template.content);
      extractMergeFields(template.content);
    }
  };

  const extractMergeFields = (htmlContent: string) => {
    const fieldRegex = /\{\{([^}]+)\}\}/g;
    const fields: Record<string, string> = {};
    let match;
    
    while ((match = fieldRegex.exec(htmlContent)) !== null) {
      const fieldName = match[1].trim();
      if (!fields[fieldName]) {
        fields[fieldName] = "";
      }
    }
    
    setMergeFields(fields);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const now = new Date();
    const template: DocumentTemplate = {
      id: selectedTemplate || Date.now().toString(),
      name: templateName,
      content,
      createdAt: selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.createdAt || now : now,
      updatedAt: now
    };

    let newTemplates;
    if (selectedTemplate) {
      newTemplates = templates.map(t => t.id === selectedTemplate ? template : t);
    } else {
      newTemplates = [...templates, template];
      setSelectedTemplate(template.id);
    }

    saveTemplates(newTemplates);
    toast.success("Template saved successfully");
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    
    const newTemplates = templates.filter(t => t.id !== selectedTemplate);
    saveTemplates(newTemplates);
    setSelectedTemplate("");
    setTemplateName("");
    setContent("");
    setMergeFields({});
    toast.success("Template deleted");
  };

  const handleNewTemplate = () => {
    setSelectedTemplate("");
    setTemplateName("");
    setContent("");
    setMergeFields({});
  };

  const replaceFields = (htmlContent: string, fields: Record<string, string>) => {
    let result = htmlContent;
    Object.entries(fields).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value || `[${key}]`);
    });
    return result;
  };

  const handlePrint = () => {
    const finalContent = replaceFields(content, mergeFields);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${finalContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handlePreview = () => {
    const finalContent = replaceFields(content, mergeFields);
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Document Preview</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .document { background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="document">
              ${finalContent}
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['table'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Document Editor</TabsTrigger>
          <TabsTrigger value="templates">Template Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="template-select">Select Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleNewTemplate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>

              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                />
              </div>

              <div>
                <Label>Document Content</Label>
                <div className="border rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    style={{ minHeight: "300px" }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                {selectedTemplate && (
                  <Button onClick={handleDeleteTemplate} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button onClick={handlePreview} variant="outline">
                  Preview
                </Button>
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {Object.keys(mergeFields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Merge Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(mergeFields).map(([field, value]) => (
                    <div key={field}>
                      <Label htmlFor={field}>{field.replace(/_/g, ' ').toUpperCase()}</Label>
                      <Input
                        id={field}
                        value={value}
                        onChange={(e) => setMergeFields(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        placeholder={`Enter ${field.replace(/_/g, ' ')}...`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Created: {template.createdAt.toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleTemplateSelect(template.id)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}